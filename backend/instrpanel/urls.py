from rest_framework.routers import DefaultRouter
from django.urls import path,include
from .views import TutorOrderViewSet,TutorDashboardAPIView,NotificationViewSet

router = DefaultRouter()
router.register(r'orders',TutorOrderViewSet,basename='tutor-orders')
router.register(r'notification', NotificationViewSet, basename="notifications")

urlpatterns = [

    path('dashboard/',TutorDashboardAPIView.as_view()),
    
    path('',include(router.urls)),
]