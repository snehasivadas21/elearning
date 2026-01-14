from rest_framework.routers import DefaultRouter
from .views import StudentViewset,InstructorViewset,AdminOrderViewSet

router = DefaultRouter()
router.register(r'students',StudentViewset,basename='students')
router.register(r'instructors',InstructorViewset,basename='instructors')
router.register(r'orders',AdminOrderViewSet,basename="orders")

urlpatterns = router.urls