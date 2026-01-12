from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ai.chat_service import ask_course_ai
from payment.models import CoursePurchase
from courses.models import Course

class CourseChatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        course_id = request.data.get("course_id")
        question = request.data.get("question")

        try:
            course = Course.objects.get(id=course_id,is_published=True)
        except Course.DoesNotExist:
            return Response({
                "error":"Course not found"
            },status=status.HTTP_404_NOT_FOUND)    

        if not CoursePurchase.objects.filter(
            student=user,
            course=course
        ).exists():
            return Response({
                "error":"You are not enrolled in this course"
            },status=status.HTTP_403_FORBIDDEN)
        
        answer = ask_course_ai(course_id, question)

        return Response({"answer": answer}, status=status.HTTP_200_OK)
