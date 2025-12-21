from rest_framework import viewsets,permissions,status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter,OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import (Course,CourseCategory,Module,Lesson,LessonResource)
from .serializers import (AdminCourseSerializer,InstructorCourseSerializer,CourseCategorySerializer,
ModuleSerializer,LessonSerializer,LessonResourceSerializer)

from users.permissions import IsInstructorUser,IsAdminUser,IsStudentUser
from .tasks import send_course_status_email
from django.utils import timezone


class AdminCourseViewSet(viewsets.ModelViewSet):
    queryset=Course.objects.all().order_by('-created_at')
    serializer_class = AdminCourseSerializer
    permission_classes = [permissions.IsAuthenticated,IsAdminUser]
    filter_backends=[DjangoFilterBackend,SearchFilter,OrderingFilter]
    filterset_fields = ['category','status','level']

    def perform_update(self,serializer):
        old_status = serializer.instance.status
        course = serializer.save()
        if old_status != course.status:
            send_course_status_email.delay(course.id)

class InstructorCourseViewSet(viewsets.ModelViewSet):
    serializer_class = InstructorCourseSerializer
    permission_classes = [permissions.IsAuthenticated,IsInstructorUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields =['category']

    def get_queryset(self):
        return Course.objects.filter(instructor=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

class CourseCategoryViewSet(viewsets.ModelViewSet):
    queryset = CourseCategory.objects.all()
    serializer_class=CourseCategorySerializer
    permission_classes=[IsAdminUser]
    filter_backends=[SearchFilter,OrderingFilter] 
    search_fields = ['name']
    ordering_fields =['name','created_at']
    
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
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course_id = self.request.query_params.get('course')
        if self.request.user.is_staff:
            qs = Module.objects.filter(is_deleted= False)
        else:    
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
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        module_id = self.request.query_params.get('module')
        if self.request.user.is_staff:
            qs = Lesson.objects.filter(is_deleted=False)
        else:    
            qs = Lesson.objects.filter(module__course__instructor=self.request.user, is_deleted=False)
        if module_id:
            qs = qs.filter(module_id=module_id)
        return qs
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response({'message': 'Deleted successfully (soft delete)'}, status=status.HTTP_204_NO_CONTENT)
    
class LessonResourceViewSet(viewsets.ModelViewSet):
    serializer_class = LessonResourceSerializer
    permission_classes = [permissions.IsAuthenticated,IsInstructorUser]

    def get_queryset(self):
        return LessonResource.objects.filter(lesson__module__course__instructor=self.request.user)   
    
