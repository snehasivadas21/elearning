from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import StudentViewset,InstructorViewset,AdminOrderViewSet,AdminDashboardAPIView

router = DefaultRouter()
router.register(r'students',StudentViewset,basename='students')
router.register(r'instructors',InstructorViewset,basename='instructors')
router.register(r'orders',AdminOrderViewSet,basename="orders")


urlpatterns = [

    path('dashboard/',AdminDashboardAPIView.as_view()),
    
    path('',include(router.urls)),
]