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

from .models import CustomUser,Profile
from .serializers import RegisterSerializer, LoginSerializer,CustomTokenObtainPairSerializer,PasswordResetConfirmSerializer,PasswordResetRequestSerializer,ProfileSerializer
from .permissions import IsInstructorUser
from .tasks import send_verification_email_task
from django.core.mail import send_mail

from courses.models import Course,Lesson,LessonProgress,LessonResource
from payment.models import CoursePurchase
from courses.serializers import AdminCourseSerializer,UserCourseDetailSerializer
from django.db.models import Avg,Count
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser,FormParser
from rest_framework.exceptions import PermissionDenied,AuthenticationFailed

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

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
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = LoginSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'username': user.username,
                'role': user.role
            }, status=200)
        except PermissionDenied as e:
            return Response({
                'error':str(e),
                'blocked':True
            },status=status.HTTP_403_FORBIDDEN)
          
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
    permission_classes=[AllowAny]
    authentication_classes=[]
    serializer_class = CustomTokenObtainPairSerializer 

class GoogleLoginView(APIView):
    permission_classes =[AllowAny]

    def post(self,request):
        token = request.data.get("credential")

        print(f"\n{'='*50}")
        print(f"Google Login Attempt")
        print(f"{'='*50}")
        print(f"Token received: {bool(token)}")
        print(f"Token length: {len(token) if token else 0}")
        print(f"Client ID from settings: {settings.GOOGLE_CLIENT_ID}")
        print(f"{'='*50}\n")

        if not token:
            return Response({"error":"No credential provided"},status=status.HTTP_400_BAD_REQUEST)

        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )   

            print(f"✓ Token verified successfully!")
            print(f"✓ Email: {idinfo.get('email')}")
            print(f"✓ Name: {idinfo.get('name')}")  

        except ValueError as e:
            error_msg = str(e)
            print(f"✗ ValueError: {error_msg}")
            return Response(
                {"error": f"Invalid Google token: {error_msg}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            error_msg = str(e)
            print(f"✗ Unexpected error: {type(e).__name__}: {error_msg}")
            return Response(
                {"error": f"Token verification failed: {error_msg}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = idinfo["email"]
        name = idinfo.get("name","")

        if not email:
            return Response(
                {"error":"Email not found in token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user,created = CustomUser.objects.get_or_create(
            email=email,
        ) 

        if created:
            user.username = name or email.split("@")[0]
            user.save()

        print(f"✓ User {'created' if created else 'found'}: {email}")

        if not user.is_active:
            return Response(
                {
                    "error":"Your account has been suspended.Please contact support.",
                    "blocked":True
                },
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        refresh["username"] = user.username or user.email.split("@")[0]
        refresh["email"] = user.email
        refresh["role"] = getattr(user, "role", "student")

        return Response({
            "access":str(refresh.access_token),
            "refresh":str(refresh),
            "role":getattr(user,"role","student"),
        },
        status=status.HTTP_200_OK
        ) 

class LogoutView(APIView):
    permission_classes =[IsAuthenticated]
    
    def post(self,request):
        refresh_token = request.data.get("refresh")
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"detail":"Logged out"})
       
class ApprovedCourseListView(generics.ListAPIView):
    serializer_class = UserCourseDetailSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category','level']
    search_fields = ['title']
    ordering_fields = ['price','title','avg_rating']
    ordering = ['title']

    def get_queryset(self):
        return Course.objects.filter(
            status='approved',
            is_active=True,
            is_published=True,
            category__is_active=True
        ).annotate(
            avg_rating=Avg("reviews__rating"),
            review_count=Count("reviews")
        )

class ApprovedCourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.filter(status = 'approved',is_active=True,is_published=True,category__is_active=True)
    serializer_class = UserCourseDetailSerializer
    permission_classes =[permissions.AllowAny]

class MyEnrolledCourseDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserCourseDetailSerializer

    def get_queryset(self):
        return Course.objects.filter(
            purchases__student=self.request.user,
            status = 'approved',
            is_active=True,
            is_published=True
        ).annotate(
            avg_rating = Avg("reviews__rating"),
            review_count = Count("reviews")
        ).distinct()  
    
class ProfileView(APIView):
    permission_classes=[IsAuthenticated]

    def get(self,request):
        profile = request.user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    def put(self,request):
        profile = request.user.profile
        serializer = ProfileSerializer(profile,data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    def patch(self,request):
        profile = request.user.profile
        serializer = ProfileSerializer(
            profile,data=request.data,partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data,status=status.HTTP_200_OK)

    
