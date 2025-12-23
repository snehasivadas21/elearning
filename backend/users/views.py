from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import viewsets,status,generics
from rest_framework.response import Response
from rest_framework import generics,permissions,filters
from django.utils import timezone
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.decorators import action
from django.conf import settings

from .models import CustomUser 
from .serializers import RegisterSerializer, LoginSerializer,CustomTokenObtainPairSerializer,PasswordResetConfirmSerializer,PasswordResetRequestSerializer
from .permissions import IsInstructorUser
from .tasks import send_verification_email_task
from django.core.mail import send_mail

from courses.models import Course
from courses.serializers import AdminCourseSerializer
from django.db.models import Avg,Sum
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser,FormParser

import random

User = get_user_model()
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        send_verification_email_task.delay(user.id)

        return Response(
            {"message":"Registration successful.Please verify your email."},status=201
        )

class VerifyEmailView(APIView):
    permission_classes=[AllowAny]

    def get(self,request):
        uid = request.query_params.get('uid')
        token = request.query_params.get('token')

        try:
            user = CustomUser.objects.get(id=uid)
        except CustomUser.DoesNotExist:
            return Response({"error":"Invalid link"},status=400)
        token_gen = PasswordResetTokenGenerator()
        if not token_gen.check_token(user,token):
            return Response({"error":"Invalid or expired token"},status=400)
        user.is_verified=True
        user.save()
        return Response({"message":"Email verified successfully"})           

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'token': str(refresh.access_token),
            'username': user.username,
            'role': user.role
        }, status=200)
          
class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            token_gen = PasswordResetTokenGenerator()
            token = token_gen.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uidb64}/{token}/"
            send_mail(
                "Password Reset Request",
                f"Click the link to reset your password: {reset_url}",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except User.DoesNotExist:
            pass
        return Response({"message": "If the email exists, a reset link has been sent."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]

    def post(self, request ,uidb64, token):
        data = {
            "uidb64": uidb64,
            "token": token,
            "new_password": request.data.get("new_password")
        }
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer    

class ApprovedCourseListView(generics.ListAPIView):
    queryset = Course.objects.filter(status = 'approved',is_active=True,is_published=True,category__is_active=True)
    serializer_class = AdminCourseSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend,filters.SearchFilter,filters.OrderingFilter]
    filterset_fields = ['category','level']
    search_fields = ['title','description']
    ordering_fields = ['price','title']
    ordering = ['title']

class ApprovedCourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.filter(status = 'approved',is_active=True,is_published=True,category__is_active=True)
    serializer_class = AdminCourseSerializer
    permission_classes =[permissions.AllowAny]

