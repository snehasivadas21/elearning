# from rest_framework.views import APIView
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework import status

# from ai.chat_service import ask_course_ai
# from payment.models import CoursePurchase
# from courses.models import Course


# class CourseChatAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         user = request.user
#         course_id = request.data.get("course_id")
#         question = request.data.get("question")

#         if not question:
#             return Response({"error": "Question is required"}, status=400)

#         try:
#             course = Course.objects.get(id=course_id, is_published=True)
#         except Course.DoesNotExist:
#             return Response({"error": "Course not found"}, status=404)

#         if not CoursePurchase.objects.filter(student=user, course=course).exists():
#             return Response({"error": "Not enrolled"}, status=403)

#         answer = ask_course_ai(user, course, question)

#         return Response({"answer": answer})
