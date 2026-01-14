from rest_framework.routers import DefaultRouter
from .views import TutorOrderViewSet

router = DefaultRouter()
router.register(r'orders',TutorOrderViewSet,basename='tutor-orders')

urlpatterns = router.urls