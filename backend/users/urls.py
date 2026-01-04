from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, VerifyEmailView,
    CustomTokenObtainPairView, GoogleLoginView, ApprovedCourseListView,
    ApprovedCourseDetailView, PasswordResetRequestView,PasswordResetConfirmView,
    ProfileView
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/',VerifyEmailView.as_view(),name='verify-email'),
    path('login/', LoginView.as_view(), name='login'),  
    path('password-reset/',PasswordResetRequestView.as_view(),name="password-reset"),
    path("password-reset-confirm/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("google/",GoogleLoginView.as_view(),name="google-login"),
    
    path('approved/', ApprovedCourseListView.as_view(), name='approved-courses'),
    path('approved/<int:pk>/', ApprovedCourseDetailView.as_view(), name='approved-course-detail'),

    path('token/', CustomTokenObtainPairView.as_view(), name="get_token"),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('profile/', ProfileView.as_view(),name="profiel"),

    path('', include(router.urls)),
]