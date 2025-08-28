# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, VerifyOTPView, ResendOTPView,
    StudentDashboardView,CustomTokenObtainPairView, ApprovedCourseListView,
    ApprovedCourseDetailView, StudentProfileViewSet , PasswordResetRequestView,PasswordResetConfirmView
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'profile', StudentProfileViewSet, basename='student-profile')


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),  
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('resend-otp/', ResendOTPView.as_view(),name='resend-otp'),
    path('password-reset/',PasswordResetRequestView.as_view(),name="password-reset"),
    path("password-reset-confirm/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),

    path('student/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    
    path('approved/', ApprovedCourseListView.as_view(), name='approved-courses'),
    path('approved/<int:pk>/', ApprovedCourseDetailView.as_view(), name='approved-course-detail'),

    path('token/', CustomTokenObtainPairView.as_view(), name="get_token"),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('', include(router.urls)),
]