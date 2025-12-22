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
    search_fields = ['title']
    ordering_fields = ['created_at']

    def perform_update(self,serializer):
        old_status = serializer.instance.status
        course = serializer.save()
        if old_status != course.status:
            send_course_status_email.delay(course.id)

    @action(detail=True,methods=['patch'])
    def approve(self,request,pk=None):
        course = self.get_object()
        course.status='approved'
        course.is_published=True
        course.admin_feedback=''
        course.save()
        send_course_status_email.delay(course.id)
        return Response({'message':'Course approved'})

    @action(detail=True,methods=['patch'])
    def reject(self,request,pk=None):
        course = self.get_object()
        course.status = 'rejected'
        course.is_published = False
        course.admin_feedback=request.data.get('admin_feedback','')
        course.save()
        send_course_status_email.delay(course.id)
        return Response({'message':'Course rejected'})       

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
    
    def perform_create(self,serializer):
        course = serializer.validated_date['course']
        if course.status != 'approved':
            raise PermissionDenied(
                "Course must be approved before adding modules."
            )
        serializer.save() 

class LessonViewSet(viewsets.ModelViewSet):
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
    
    def perform_create(self,serializer):
        module = serializer.validated_data['module']
        course = module.course

        if course.status != 'approved':
            raise PermissionDenied(
                "Course must be approved before adding lessons."
            )
        serializer.save()    
    
class LessonResourceViewSet(viewsets.ModelViewSet):
    serializer_class = LessonResourceSerializer
    permission_classes = [permissions.IsAuthenticated,IsInstructorUser]

    def get_queryset(self):
        return LessonResource.objects.filter(lesson__module__course__instructor=self.request.user)   
    
    def perform_create(self,serializer):
        lesson = serializer.validated_data['lesson']
        course = lesson.module.course

        if course.status != 'approved':
            raise PermissionDenied(
                "Course must be approved before adding resources."
            )
        serializer.save()