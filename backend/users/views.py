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
import cloudinary.utils

from .models import CustomUser,Profile,ProfileLink
from .serializers import RegisterSerializer, LoginSerializer,CustomTokenObtainPairSerializer,PasswordResetConfirmSerializer,PasswordResetRequestSerializer,ProfileSerializer,ProfileLinkSerializer
from .permissions import IsInstructorUser
from .tasks import send_verification_email_task
from django.core.mail import send_mail

from courses.models import Course,Lesson,LessonProgress,LessonResource,CourseCertificate
from payment.models import CoursePurchase
from quiz.models import UserQuizAttempt
from courses.serializers import AdminCourseSerializer,UserCourseDetailSerializer
from django.db.models import Avg,Count,Sum,Max
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
    ordering = ['-updated_at']

    def get_queryset(self):
        return Course.objects.filter(
            is_active=True,
            is_published=True,
            category__is_active=True
        ).annotate(
            avg_rating=Avg("reviews__rating",distinct=True),
            review_count=Count("reviews",distinct=True),
            total_duration=Sum("modules__lessons__duration"),
        )

class ApprovedCourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.filter(is_active=True,is_published=True,category__is_active=True)
    serializer_class = UserCourseDetailSerializer
    permission_classes =[permissions.AllowAny]

class MyEnrolledCourseDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserCourseDetailSerializer

    def get_queryset(self):
        return Course.objects.filter(
            purchases__student=self.request.user,
            is_active=True,
        ).annotate(
            avg_rating = Avg("reviews__rating",distinct=True),
            review_count = Count("reviews",distinct=True),
            total_duration=Sum("modules__lessons__duration") 
        ).distinct()  
    
class ProfileView(APIView):
    permission_classes=[IsAuthenticated]

    def get(self,request):
        profile = Profile.objects.prefetch_related('links').get(user=request.user)
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

class ProfileLinkView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = Profile.objects.prefetch_related('links').get(user=request.user)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        profile = request.user.profile
        serializer = ProfileLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(profile=profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, link_id):
        profile = request.user.profile
        try:
            link = profile.links.get(id=link_id)
            link.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProfileLink.DoesNotExist:
            return Response({"detail": "Link not found."}, status=status.HTTP_404_NOT_FOUND)
            
class StudentPortfolioAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = request.user

        purchases = CoursePurchase.objects.filter(student=student).select_related("course")

        total_enrolled = purchases.count()
        completed_courses = 0
        ongoing_courses = 0

        course_data = []
        total_progress_sum = 0
        overall_quiz_percentages = []

        for purchase in purchases:
            course = purchase.course

            if purchase.progress_locked:
                progress = 100
            else:
                total_lessons = Lesson.objects.filter(
                    module__course=course,
                    duration__gt=0,
                    is_deleted=False,
                    is_active=True,
                    created_at__lte=purchase.purchased_at  
                ).count()

                completed_lessons = LessonProgress.objects.filter(
                    student=student,
                    lesson__module__course=course,
                    lesson__duration__gt=0,
                    completed=True,
                    lesson__created_at__lte=purchase.purchased_at  
                ).count()

                progress = 0
                if total_lessons > 0:
                    progress = round((completed_lessons / total_lessons) * 100, 2)

            total_progress_sum += progress

            if progress >= 100:
                completed_courses += 1
                status_label = "Completed"
            else:
                ongoing_courses += 1
                status_label = "Ongoing"

            quiz_attempts = UserQuizAttempt.objects.filter(
                user=student,
                quiz__course=course
            )

            quiz_average = 0

            if quiz_attempts.exists():
                best_attempts = (
                    quiz_attempts
                    .values("quiz")
                    .annotate(best_percentage=Max("percentage"))
                )

                percentages = [item["best_percentage"] for item in best_attempts]
                quiz_average = round(sum(percentages) / len(percentages), 2)
                overall_quiz_percentages.extend(percentages)

            course_data.append({
                "course_id": course.id,
                "course_title": course.title,
                "progress": progress,
                "quiz_average": quiz_average,
                "status": status_label
            })

        overall_progress = round(
            total_progress_sum / total_enrolled, 2
        ) if total_enrolled > 0 else 0

        overall_quiz_average = round(
            sum(overall_quiz_percentages) / len(overall_quiz_percentages), 2
        ) if overall_quiz_percentages else 0

        certificates = CourseCertificate.objects.filter(student=student).select_related("course")

        certificate_data = []

        for cert in certificates:
            certificate_url = None

            if cert.certificate_file:
                certificate_url, _ = cloudinary.utils.cloudinary_url(
                    cert.certificate_file.name,
                    resource_type="raw",
                    secure=True
                )

            certificate_data.append({
                "course": cert.course.title,
                "certificate_id": cert.certificate_id,
                "certificate_url": certificate_url,
                "issued_at": cert.issued_at
            })

        return Response({
            "profile": {
                "name": student.username,
                "email": student.email,
                "joined_date": student.date_joined
            },
            "stats": {
                "total_enrolled": total_enrolled,
                "completed": completed_courses,
                "ongoing": ongoing_courses,
                "certificates": certificates.count(),
                "overall_progress": overall_progress,
                "overall_quiz_average": overall_quiz_average
            },
            "courses": course_data,
            "certificates": certificate_data
        }, status=status.HTTP_200_OK)