from rest_framework.routers import DefaultRouter
from .views import TutorOrderViewSet,NotificationViewSet

router = DefaultRouter()
router.register(r'orders',TutorOrderViewSet,basename='tutor-orders')
router.register(r'notification', NotificationViewSet, basename="notifications")

urlpatterns = router.urls