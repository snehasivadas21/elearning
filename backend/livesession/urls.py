from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LiveSessionViewSet

router = DefaultRouter()
router.register(r'live-sessions', LiveSessionViewSet)

urlpatterns = router.urls