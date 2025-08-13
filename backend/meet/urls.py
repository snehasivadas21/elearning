from rest_framework.routers import DefaultRouter
from .views import InstructorMockInterviewViewSet,StudentMockInterviewViewSet

router = DefaultRouter()

router.register(r'instructor/mock-interviews', InstructorMockInterviewViewSet, basename="instructor-mock")
router.register(r'student/mock-interviews', StudentMockInterviewViewSet, basename="student-mock")


urlpatterns = router.urls