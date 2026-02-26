from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets,permissions,filters
from users.models import CustomUser
from .serializers import UserSerializer,AdminOrderSerializer
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from payment.models import Order
from users.permissions import IsAdminUser
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from users.models import CustomUser
from courses.models import Course
from payment.models import CoursePurchase
from revenue.models import PlatformRevenue

class StudentViewset(viewsets.ModelViewSet):
    queryset = CustomUser.objects.filter(role='student')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]  
    filter_backends = [DjangoFilterBackend,filters.SearchFilter,filters.OrderingFilter]
    search_fields = ['username','email']
    ordering_fields = ['id','username','date_joined'] 

class InstructorViewset(viewsets.ModelViewSet):
    queryset = CustomUser.objects.filter(role='instructor')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]  
    filter_backends = [DjangoFilterBackend,filters.SearchFilter,filters.OrderingFilter]
    search_fields = ['username','email']
    ordering_fields = ['id','username','date_joined'] 

class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Order.objects.select_related("student", "course").order_by("-created_at")
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAdminUser]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = ["status", "course"]
    search_fields = ["student__email", "student__username"]
    ordering_fields = ["created_at", "amount"]

class AdminDashboardAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self,request):
        total_students = CustomUser.objects.filter(role="student").count()
        total_instructors = CustomUser.objects.filter(role="instructor").count()
        total_course = Course.objects.count()
        total_enrollments = CoursePurchase.objects.count()

        revenue_data = PlatformRevenue.objects.aggregate(
            total_revenue = Sum("total_amount")
        )
        total_revenue = revenue_data["total_revenue"]  or 0

        monthly_revenue = (
            PlatformRevenue.objects.annotate(month = TruncMonth("created_at"))
            .values("month")
            .annotate(total = Sum("total_amount"))
            .order_by("month")
        )

        monthly_users = (
            CustomUser.objects.annotate(month = TruncMonth("date_joined"))
            .values("month","role")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        monthly_courses = (
            Course.objects.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        return Response({
            "stats":{
                "total_students": total_students,
                "total_instructors": total_instructors,
                "total_courses": total_course,
                "total_enrollment": total_enrollments,
                "total_revenue": total_revenue
            },
            "monthly_revenue": monthly_revenue,
            "monthly_users":monthly_users,
            "monthly_courses":monthly_courses
        })

