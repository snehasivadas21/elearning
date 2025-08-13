from django.shortcuts import render
from rest_framework.views import APIView
from users.permissions import IsInstructorUser
from courses.models import Course
from payment.models import CoursePurchase
from django.db.models import Sum,Avg
from quiz.models import Quiz
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Create your views here.
class InstructorDashboardView(APIView):
    permission_classes = [IsAuthenticated,IsInstructorUser]

    def get(self,request):
        instructor = request.user 

        courses = Course.objects.filter(instructor=instructor)
        course_ids = courses.values_list('id',flat=True)

        total_courses = courses.count()
        total_students= CoursePurchase.objects.filter(course__in=courses,is_paid=True).count()
        total_earnings =CoursePurchase.objects.filter(course__in=courses,is_paid=True).aggregate(
            total = Sum('price'))['total'] or 0.0
        average_ratings = courses.aggregate(avg=Avg('rating'))['avg'] or 0.0
        total_quizzes = Quiz.objects.filter(module__course__in=courses).count()
        return Response({
            "total_courses":total_courses,
            "total_students":total_students,
            "total_earnings":total_earnings,
            "average_rating":round(average_ratings,2),
            "total_quizzes" : total_quizzes

        })