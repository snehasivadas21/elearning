from rest_framework import viewsets,permissions,serializers
from .models import (Course,CourseCategory,Module,Lesson,LessonProgress,CourseCertificate,LessonResource,CourseReview)
from .serializers import (AdminCourseSerializer,InstructorCourseSerializer,CourseCategorySerializer,
ModuleSerializer,LessonSerializer,LessonProgressSerializer,CertificateSerializer,LessonResourceSerializer,
CourseReviewSerializer)

from users.permissions import IsInstructorUser,IsAdminUser,IsStudentUser
from .tasks import send_course_status_email
from django.utils import timezone
from .utils import issue_certificate_if_eligible

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
        return self.queryset.filter(student=self.request.user) 
    
class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudentUser]

    def get_queryset(self):
        return CourseCertificate.objects.filter(student=self.request.user)
    
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