from rest_framework.routers import DefaultRouter
from .views import StudentViewset,InstructorViewset

router = DefaultRouter()
router.register(r'students',StudentViewset,basename='students')
router.register(r'instructors',InstructorViewset,basename='instructors')

urlpatterns = router.urls