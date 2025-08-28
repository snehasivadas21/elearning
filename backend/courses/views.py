from rest_framework import viewsets,permissions,serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (Course,CourseCategory,Module,Lesson,LessonProgress,CourseCertificate,LessonResource,CourseReview)
from .serializers import (AdminCourseSerializer,InstructorCourseSerializer,CourseCategorySerializer,
ModuleSerializer,LessonSerializer,LessonProgressSerializer,CertificateSerializer,LessonResourceSerializer,
CourseReviewSerializer)

from users.permissions import IsInstructorUser,IsAdminUser,IsStudentUser
from .tasks import send_course_status_email
from django.utils import timezone
from .utils import issue_certificate_if_eligible,verify_certificate
from .utils import get_course_progress


class AdminCourseViewSet(viewsets.ModelViewSet):
    queryset=Course.objects.all().order_by('-created_at')
    serializer_class = AdminCourseSerializer
    permission_classes = [permissions.IsAuthenticated,IsAdminUser]

    def perform_update(self,serializer):
        old_status = serializer.instance.status
        course = serializer.save()
        if old_status != course.status:
            send_course_status_email.delay(course.id)

class InstructorCourseViewSet(viewsets.ModelViewSet):
    serializer_class = InstructorCourseSerializer
    permission_classes = [permissions.IsAuthenticated,IsInstructorUser]

    def get_queryset(self):
        return Course.objects.filter(instructor=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

class CourseCategoryViewSet(viewsets.ModelViewSet):
    queryset = CourseCategory.objects.filter(is_active=True).order_by('name')
    serializer_class = CourseCategorySerializer
    permission_classes = [permissions.AllowAny]  
    pagination_class = None      

class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated,IsInstructorUser]

    def get_queryset(self):
        course_id = self.request.query_params.get('course')
        qs = Module.objects.filter(course__instructor=self.request.user, is_deleted=False)
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response({'message': 'Deleted successfully (soft delete)'}, status=status.HTTP_204_NO_CONTENT)

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated,IsInstructorUser]
    
    def get_queryset(self):
        module_id = self.request.query_params.get('module')
        qs = Lesson.objects.filter(module__course__instructor=self.request.user, is_deleted=False)
        if module_id:
            qs = qs.filter(module_id=module_id)
        return qs
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response({'message': 'Deleted successfully (soft delete)'}, status=status.HTTP_204_NO_CONTENT)
    
class LessonProgressViewSet(viewsets.ModelViewSet):
    queryset = LessonProgress.objects.all()
    serializer_class = LessonProgressSerializer
    permission_classes = [permissions.IsAuthenticated,IsStudentUser]

    def perform_create(self, serializer):
        progress = serializer.save(student=self.request.user, completed_at=timezone.now())
        issue_certificate_if_eligible(student = self.request.user,course=progress.lesson.module.course)
    
    def get_queryset(self):
        return LessonProgress.objects.filter(student=self.request.user) 
    
    @action(detail=True,methods=["post"])
    def complete(self,request,pk=None):
        try:
            lesson=Lesson.objects.get(pk=pk)
        except Lesson.DoesNotExist:
            return Response({"error":"Lesson not found"},status=404)
        progress,created = LessonProgress.objects.get_or_create(
            student = request.user,lesson = lesson
        )  
        progress.mark_completed()
        return Response({"message":"Lesson marked completed"})  
    
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

    def get_queryset(self):
        return CourseCertificate.objects.filter(student=self.request.user)
    
    @action(detail=False,methods = ["get"],permission_classes=[permissions.AllowAny])
    def verify(self,request):
        certificate_id = request.query_params.get("certificate_id")
        result = verify_certificate(certificate_id)
        if not result:
            return Response({"error":"Certificate not found"},status=404)
        return Response(result)
    
class LessonResourceViewSet(viewsets.ModelViewSet):
    serializer_class = LessonResourceSerializer
    permission_classes = [permissions.IsAuthenticated,IsInstructorUser]

    def get_queryset(self):
        return LessonResource.objects.filter(lesson__module__course__instructor=self.request.user)   
    

class CourseReviewViewSet(viewsets.ModelViewSet):
    serializer_class =  CourseReviewSerializer
    permission_classes = [permissions.IsAuthenticated,IsStudentUser]

    def get_queryset(self):
        return CourseReview.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        serializer.save() 