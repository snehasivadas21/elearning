from rest_framework import viewsets,permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.db.models import Count,Sum
from django.db.models.functions import TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import TutorOrderSerializer,NotificationSerializer
from users.permissions import IsInstructorUser
from payment.models import Order,CoursePurchase
from courses.models import Course
from revenue.models import InstructorWallet

class TutorOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TutorOrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorUser]
    filter_backends = [DjangoFilterBackend,SearchFilter]
    search_fields = ["course__title","student__email"]

    def get_queryset(self):
        return Order.objects.filter(
            course__instructor=self.request.user,
            status="completed"
        ).select_related("course", "student").order_by("-created_at")

from revenue.models import InstructorWallet, WalletTransaction

class TutorDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]  

    def get(self, request):
        instructor = request.user

        instructor_courses = Course.objects.filter(instructor=instructor)
        total_courses = instructor_courses.count()

        total_students = CoursePurchase.objects.filter(
            course__in=instructor_courses
        ).count()

        try:
            wallet = InstructorWallet.objects.get(instructor=instructor)
            total_earnings = wallet.total_earned  
        except InstructorWallet.DoesNotExist:
            total_earnings = 0

        monthly_earnings = (
            WalletTransaction.objects.filter(
                wallet__instructor=instructor,
                transaction_type="CREDIT"
            )
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )

        students_per_course = (
            CoursePurchase.objects.filter(course__in=instructor_courses)
            .values("course__title")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        revenue_per_course = (
            Order.objects.filter(
                course__in=instructor_courses,
                status="completed"
            )
            .values("course__title")
            .annotate(
                total=Sum("amount") - Sum("platform_revenue__commission_amount")
            )
            .order_by("-total")
        )

        return Response({
            "stats": {
                "total_courses": total_courses,
                "total_students": total_students,
                "total_earnings": total_earnings
            },
            "monthly_earnings": monthly_earnings,
            "students_per_course": students_per_course,
            "revenue_per_course": revenue_per_course
        })


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")
