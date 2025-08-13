from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework import viewsets,status
from rest_framework.response import Response
from rest_framework import generics,permissions,filters
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.decorators import action

from .models import CustomUser, EmailOTP,StudentProfile
from .serializers import RegisterSerializer, LoginSerializer,CustomTokenObtainPairSerializer,StudentProfileSerializer
from .permissions import IsInstructorUser
from .tasks import send_otp_email_task

from courses.models import Course,LessonProgress
from courses.serializers import AdminCourseSerializer
from quiz.models import QuizSubmission,Quiz
from payment.models import CoursePurchase
from django.db.models import Avg,Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser,FormParser


import random

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            otp_code = str(random.randint(100000, 999999))
            otp = EmailOTP.objects.create(
                user=user,
                otp=otp_code,
                created_at=timezone.now()
            )
            send_otp_email_task.delay(user.email,otp_code)
            
            print(f"OTP for {user.email} is: {otp.otp}")
            return Response({"message": "User registered. Check your email for OTP."}, status=201)
        print("❌ Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=400)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp_input = request.data.get('otp')

        try:
            user = CustomUser.objects.get(email=email)
            otp = EmailOTP.objects.get(user=user)

            if otp.is_expired():
                return Response({'error': 'OTP expired'}, status=400)
            
            if otp.used:
                return Response({'error':'OTP already user'},status=400)

            if otp.otp != otp_input:
                return Response({'error': 'Invalid OTP'}, status=400)

            user.is_verified = True
            user.save()
            otp.used=True
            otp.save()

            return Response({'message': 'Email verified successfully'}, status=200)

        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        except EmailOTP.DoesNotExist:
            return Response({'error': 'OTP not found'}, status=404)
        
class ResendOTPView(APIView):
    permission_classes=[AllowAny]

    def post(self,request):
        email = request.data.get("email")

        try:
            user=CustomUser.objects.get(email=email)

            EmailOTP.objects.filter(user=user).delete()

            otp_code=str(random.randint(1000000,999999))
            otp=EmailOTP.objects.create(user=user,otp=otp_code)

            send_otp_email_task.delay(user.email,otp_code)

            return Response({"message":"OTP resent successfully."},status=200)
        except CustomUser.DoesNotExist:
            return Response({"error":"User not found"},status=404)       


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'token': str(refresh.access_token),
                'username': user.username,
                'role': user.role
            }, status=200)
        return Response(serializer.errors, status=401)


class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        profile_data = {
            "bio": "",
            "dob": "",
            "phone": ""
        }

        if hasattr(user, 'student_profile'):
            profile = user.student_profile
            profile_data = {
                "bio": profile.bio or "",
                "dob": profile.dob or "",
                "phone": profile.phone or "",
            }

        # Fetch enrolled courses
        enrollments = CoursePurchase.objects.filter(student=user)
        total_courses = enrollments.count()

        # Course progress
        total_lessons_completed = LessonProgress.objects.filter(student=user).count()

        # Quiz stats
        quiz_submissions = QuizSubmission.objects.filter(student=user)
        total_quizzes_taken = quiz_submissions.count()
        avg_score = quiz_submissions.aggregate(avg=Avg('score')).get('avg') or 0

        # Response
        data = {
            "username": user.username,
            "email": user.email,
            "profile": profile_data,
            "enrolled_courses": total_courses,
            "lessons_completed": total_lessons_completed,
            "quizzes_taken": total_quizzes_taken,
            "average_quiz_score": round(avg_score, 2),
        }

        return Response(data)
    
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer    

class ApprovedCourseListView(generics.ListAPIView):
    queryset = Course.objects.filter(status = 'approved')
    serializer_class = AdminCourseSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend,filters.SearchFilter,filters.OrderingFilter]
    filterset_fields = ['category','is_free']
    search_fields = ['title','description']
    ordering_fields = ['price','title']
    ordering = ['title']

class ApprovedCourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.filter(status = 'approved')
    serializer_class = AdminCourseSerializer
    permission_classes =[permissions.AllowAny]
    
class StudentProfileViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @action(detail=False, methods=['get', 'put'], url_path='me')
    def me(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)

        if request.method == 'GET':
            serializer = StudentProfileSerializer(profile)
            return Response(serializer.data)

        elif request.method == 'PUT':
            serializer = StudentProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"detail": "Profile updated successfully"}, status=200)
            return Response(serializer.errors, status=400)