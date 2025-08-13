from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (AdminCourseViewSet, InstructorCourseViewSet, CourseCategoryViewSet,ModuleViewSet,LessonViewSet,
LessonProgressViewSet,CertificateViewSet,LessonResourceViewSet,CourseReviewViewSet)

router = DefaultRouter()
router.register(r'admin/courses', AdminCourseViewSet, basename='admin-courses')
router.register(r'instructor/courses', InstructorCourseViewSet, basename='instructor-courses')
router.register(r'categories', CourseCategoryViewSet, basename='course-category')
router.register(r'modules', ModuleViewSet, basename='module')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'lesson-progress',LessonProgressViewSet,basename='lesson-progress')
router.register(r'certificate',CertificateViewSet,basename='certificates')
router.register(r'lesson-resources',LessonResourceViewSet,basename='lesson-resources')
router.register(r'reviews',CourseReviewViewSet,basename='course-review')

urlpatterns = router.urls  