from rest_framework import viewsets,permissions,status,generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter,OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.http import FileResponse
from django.core.exceptions import PermissionDenied,ValidationError
from rest_framework.parsers import MultiPartParser,FormParser
from django.shortcuts import get_object_or_404

from .models import (Course,CourseCategory,Module,Lesson,LessonResource,LessonProgress,CourseCertificate,Review)
from payment.models import CoursePurchase
from .serializers import (AdminCourseSerializer,InstructorCourseSerializer,CourseCategorySerializer,
ModuleSerializer,LessonSerializer,LessonResourceSerializer,LessonProgressSerializer,CertificateSerializer,ReviewSerializer)
from rest_framework.permissions import IsAuthenticated,AllowAny
from users.permissions import IsInstructorUser,IsAdminUser,IsStudentUser
from .tasks import send_course_status_email
from .utils import issue_certificate_if_eligible,verify_certificate,get_course_progress,generate_certificate_file
from cloudinary_storage.storage import MediaCloudinaryStorage
from ai.pdf_ingestion import index_lesson_resource


class AdminCourseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdminCourseSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends=[DjangoFilterBackend,SearchFilter,OrderingFilter]
    filterset_fields = ['category','status','level']
    search_fields = ['title']
    ordering_fields = ['created_at']

    def get_queryset(self):
        return Course.objects.filter(is_active=True).exclude(status='draft').order_by('-created_at')

    @action(detail=True,methods=['patch'])
    def approve(self,request,pk=None):
        course = self.get_object()

        if course.status != 'submitted':
            return Response(
                {"detail":"Only submitted courses can be approved"},
                status=status.HTTP_400_BAD_REQUEST
            )
        course.status='approved'
        course.is_published=True
        course.admin_feedback=request.data.get('admin_feedback','')
        course.save(update_fields=['status','is_published','admin_feedback','updated_at'])
        send_course_status_email.delay(course.id)
        return Response({'message':'Course approved successfully'})

    @action(detail=True,methods=['patch'])
    def reject(self,request,pk=None):
        course = self.get_object()

        if course.status != 'submitted':
            return Response(
                {"detail":"Only submitted courses can be rejected."},
                status=status.HTTP_400_BAD_REQUEST
            )
        course.status = 'rejected'
        course.is_published = False
        course.admin_feedback=request.data.get('admin_feedback','')
        course.save(update_fields=['status','is_published','admin_feedback','updated_at'])
        send_course_status_email.delay(course.id)
        return Response({'message':'Course rejected successfully'})    

    @action(detail=True,methods=['patch'])
    def toggel_active(self,request,pk=None):
        course=self.get_object()
        course.is_active=not course.is_active
        course.save(update_fields=['status','is_published','admin_feedback','updated_at'])
        return Response({"is_active":course.is_active})   

class InstructorCourseViewSet(viewsets.ModelViewSet):
    serializer_class = InstructorCourseSerializer
    permission_classes = [permissions.IsAuthenticated,IsInstructorUser]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields =['category']

    def get_queryset(self):
        return Course.objects.filter(instructor=self.request.user,is_active=True).order_by('-created_at')
    
    def destroy(self, request, *args, **kwargs):
        course = self.get_object()
        if course.status == 'approved':
            return Response(
                {"detail":"Approved courses cannot be deleted"},
                status=403
            )
        course.is_active = False
        course.save()
        return Response(status=204)
    
    @action(detail=True, methods=["post"], url_path="submit")
    def submit_for_review(self, request, pk=None):
        course = self.get_object()

        if course.instructor != request.user:
            raise PermissionDenied("Not your course")

        if course.status not in ["draft", "rejected", "approved"]:
            return Response(
                {"detail": "Only draft, rejected, or approved courses can be submitted"},
                status=400
            )

        course.status = "submitted"
        course.is_published = False
        course.save(update_fields=["status", "is_published", "updated_at"])

        return Response({"message": "Course submitted for review"})

class CourseCategoryViewSet(viewsets.ModelViewSet):
    serializer_class=CourseCategorySerializer
    filter_backends=[SearchFilter,OrderingFilter] 
    search_fields = ['name']
    ordering_fields =['name','created_at']

    def get_queryset(self):
        qs = CourseCategory.objects.all()
        if not self.request.user.is_staff:
           qs = qs.filter(is_active=True)
        return qs

    def get_permissions(self):
        if self.action in ['list','retrieve']:
            return [AllowAny()]
        return [IsAdminUser()] 
    
    @action(detail=True,methods=['patch'],permission_classes=[IsAdminUser])
    def toggle_status(self,request,pk=None):
        category=self.get_object()
        category.is_active=not category.is_active
        category.save()
        return Response(
            {"is_active":category.is_active},
            status=status.HTTP_200_OK
        )

class ModuleViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Module.objects.filter(is_deleted= False)

        if not self.request.user.is_staff:
           qs=qs.filter(course__instructor=self.request.user)
        course_id = self.request.query_params.get('course')  

        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs
    
    def perform_create(self,serializer): 
        course = serializer.validated_data['course'] 
        if not self.request.user.is_staff and course.instructor != self.request.user: 
            raise PermissionDenied("You do not own this course.") 
        serializer.save()


    def perform_update(self, serializer):
        module = self.get_object()
        course = module.course

        if course.status in ["approved", "submitted"]:
            raise PermissionDenied("Cannot edit modules of approved/submitted courses")

        serializer.save()      

    def destroy(self, request, *args, **kwargs):
        module = self.get_object()
        course = module.course

        if course.status in ["approved", "submitted"]:
            return Response(
                {"detail": "Cannot delete modules of approved/submitted courses"},
                status=403
            )

        module.is_deleted = True
        module.save(update_fields=['is_deleted'])
        return Response(status=204)

class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = Lesson.objects.filter(is_deleted=False)
       
        if not self.request.user.is_staff:    
            qs = qs.filter(module__course__instructor=self.request.user)

        module_id = self.request.query_params.get('module')    
        if module_id:
            qs = qs.filter(module_id=module_id)
        return qs
    
    def perform_create(self,serializer): 
        module = serializer.validated_data['module'] 
        course = module.course 
        if not self.request.user.is_staff and course.instructor != self.request.user: 
            raise PermissionDenied("You do not own this course") 
        serializer.save()


    def perform_update(self, serializer):
        lesson = self.get_object()
        course = lesson.module.course

        if course.status in ["approved", "submitted"]:
            raise PermissionDenied("Cannot edit lessons of approved/submitted courses")

        serializer.save()

    def destroy(self, request, *args, **kwargs):
        lesson = self.get_object()
        course = lesson.module.course

        if course.status in ["approved", "submitted"]:
            return Response(
                {"detail": "Cannot delete lessons of approved/submitted courses"},
                status=403
            )

        lesson.is_deleted = True
        lesson.save(update_fields=['is_deleted'])
        return Response(status=204)
       
class LessonResourceViewSet(viewsets.ModelViewSet):
    serializer_class = LessonResourceSerializer
    permission_classes = [permissions.IsAuthenticated,IsInstructorUser]

    def get_queryset(self):
        return LessonResource.objects.filter(lesson__module__course__instructor=self.request.user) 
    
    def perform_create(self,serializer):
        lesson = serializer.validated_data['lesson']
        course = lesson.module.course

        resource = serializer.save()
        if resource.file :
            index_lesson_resource(resource)

    def perform_update(self, serializer):
        resource = self.get_object()
        course = resource.lesson.module.course

        if course.status in ["approved", "submitted"]:
            raise PermissionDenied(
                "This course is live. You cannot edit existing resources."
            )

        serializer.save()
        if resource.file :
            index_lesson_resource(resource)

    def destroy(self, request, *args, **kwargs):
        resource = self.get_object()
        course = resource.lesson.module.course

        if course.status in ["approved", "submitted"]:
            return Response(
                {
                    "detail": "This course is live. You cannot delete resources."
                },
                status=403
            )

        resource.delete()
        return Response(status=204)      

class LessonProgressViewSet(viewsets.GenericViewSet):
    serializer_class = LessonProgressSerializer
    permission_classes = [permissions.IsAuthenticated,IsStudentUser]
    
    def get_queryset(self):
        return LessonProgress.objects.filter(student=self.request.user) 
    
    @action(detail=False, methods=["post"], url_path="lessons/(?P<lesson_id>[^/.]+)/toggle")
    def toggle_complete(self, request, lesson_id=None):
        lesson = get_object_or_404(Lesson, id=lesson_id)

        progress, _ = LessonProgress.objects.get_or_create(
            student=request.user,
            lesson=lesson
        )

        progress.completed = not progress.completed
        progress.completed_at = timezone.now() if progress.completed else None
        progress.save()

        issue_certificate_if_eligible(
            student=request.user,
            course=lesson.module.course
        )

        return Response({
            "lesson_id": lesson.id,
            "completed": progress.completed
        })
 
class CourseProgressViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True,methods = ["get"])
    def progress(self,request,pk=None):
        try:
            course = Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return Response({"error":"Course not found"},status=404)
        progress_percent = get_course_progress(request.user,course)
        return Response({"course_id":pk,"progress":progress_percent})                 
    
class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudentUser]
    lookup_field = "certificate_id"
    lookup_value_regex = "[^/]+"

    def get_queryset(self):
        return CourseCertificate.objects.filter(student=self.request.user)
    
    @action(detail=False,methods = ["get"],permission_classes=[permissions.AllowAny])
    def verify(self,request):
        certificate_id = request.query_params.get("certificate_id")
        if not certificate_id:
            return Response({"error":"certificate_id required"},status=400)
        result = verify_certificate(certificate_id)
        if not result:
            return Response({"error":"Certificate not found"},status=404)
        return Response(result)

    @action(detail=True, methods=["get"])
    def download(self, request, certificate_id=None):
        certificate = self.get_object()

        if not certificate.certificate_file:
            return Response({"error": "Certificate file not found"}, status=404)

        storage = MediaCloudinaryStorage()
        public_id = certificate.certificate_file.name.replace("media/", "") 
        url = storage.url(public_id) 

        return Response({"download_url": url})
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    queryset = Review.objects.select_related("user", "course")

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "review_status"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()

        course_id = self.request.query_params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        course = serializer.validated_data["course"]

        if not CoursePurchase.objects.filter(
            student=user,
            course=course
        ).exists():
            raise PermissionDenied("Only enrolled students can review this course")

        serializer.save(user=user)

    def perform_update(self, serializer):
        review = self.get_object()
        if review.user != self.request.user:
            raise PermissionDenied("You can edit only your own review")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        if review.user != request.user:
            raise PermissionDenied("You can delete only your own review")
        review.delete()
        return Response({"message":"Review deleted successfully"},status=204)

    @action(detail=False, methods=["get"])
    def review_status(self, request):
        course_id = request.query_params.get("course")

        if not course_id:
            return Response({"detail": "course is required"}, status=400)

        is_enrolled = CoursePurchase.objects.filter(
            student=request.user,
            course_id=course_id
        ).exists()

        review = Review.objects.filter(
            user=request.user,
            course_id=course_id
        ).first()

        return Response({
            "is_enrolled": is_enrolled,
            "has_reviewed": bool(review),
            "review": ReviewSerializer(review).data if review else None,
            "can_review": is_enrolled,
        })