import logging
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from users.permissions import IsInstructorUser
from .models import Quiz, Question, Option, UserQuizAttempt, UserAnswer
from .serializers import QuizSerializer, QuizSubmissionSerializer, QuestionSerializer, AttemptDetailSerializer
from courses.utils import issue_certificate_if_eligible

logger = logging.getLogger(__name__)


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        quiz = self.get_object()
        logger.info(f"Quiz {quiz.id} fetched by user {request.user.id}")
        return super().retrieve(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        quiz = serializer.save()
        course = quiz.course

        logger.info(f"Quiz created | Tutor: {self.request.user.id} | Quiz: {quiz.id}")

        if not self.request.user.is_staff and course.status == "approved":
            course.status = "submitted"
            course.save(update_fields=["status", "is_published", "updated_at"])

            logger.info(f"Course resubmitted due to quiz creation | course_id={course.id}")

    def perform_update(self, serializer):
        quiz = self.get_object()
        course = quiz.course

        if course.status == "submitted":
            raise PermissionDenied(
                "Cannot edit quiz while course is under review"
            )

        serializer.save()
        logger.info(
            "Quiz updated | Tutor: %s | Quiz: %s",
            self.request.user.id,
            quiz.id
        )

        if not self.request.user.is_staff and course.status == "approved":
            course.status = "submitted"
            course.save(update_fields=["status", "is_published", "updated_at"])

            logger.info(f"Course resubmitted due to quiz update | course_id={course.id}")

    def perform_destroy(self, instance):
        course = instance.course

        if course.status == "submitted":
            raise PermissionDenied(
                "Cannot delete quiz of approved/submitted courses"
            )
        
        instance.delete()

        logger.warning(
            "Quiz deleted | Tutor: %s | Quiz: %s",
            self.request.user.id,
            instance.id
        )   

        if not self.request.user.is_staff and course.status == "approved":
            course.status = "submitted"
            course.save(update_fields=["status", "is_published", "updated_at"])

            logger.info(f"Course resubmitted due to quiz deletion | course_id={course.id}")

    @action(detail=True, methods=["post"], url_path="add-question")
    def add_question(self, request, pk=None):
        quiz = self.get_object()
        course = quiz.course

        if course.status == "submitted":
            return Response(
                {"error": "Cannot modify quiz of approved/submitted courses"},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.user.role != "instructor":
            return Response(
                {"error": "Only tutor can add questions"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = QuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(quiz=quiz)

        logger.info(
            "Question added | Tutor: %s | Quiz: %s",
            request.user.id,
            quiz.id
        )

        if not request.user.is_staff and course.status == "approved":
            course.status = "submitted"
            course.save(update_fields=["status", "is_published", "updated_at"])

            logger.info(f"Course resubmitted due to question addition | course_id={course.id}")

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="submit")
    @transaction.atomic
    def submit(self, request, pk=None):
        quiz = self.get_object()
        user = request.user

        if user.role != "student":
            return Response(
                {"error":"Only students can attempt quiz"},
                status=status.HTTP_403_FORBIDDEN
            )

        attempts = UserQuizAttempt.objects.filter(
            user=user,
            quiz=quiz
        ).order_by("attempt_number")

        attempts_count = attempts.count()

        if attempts.filter(is_passed=True).exists():
            return Response(
                {"error":"You already passed this quiz."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if attempts_count >= quiz.max_attempts:
            logger.warning(
                f"User {user.id} exceeded max attempts for quiz {quiz.id}"
            )
            return Response(
                {"error": "Maximum attempts reached"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = QuizSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers_data = serializer.validated_data["answers"]

        if not answers_data:
            return Response(
                {"error": "You must answer all questions."},
                status=status.HTTP_400_BAD_REQUEST
            )

        questions = quiz.questions.all()

        if len(answers_data) != questions.count():
            return Response(
                {"error": "All questions must be answered."},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_marks = 0
        obtained_marks = 0
        validated_answers = []

        for item in answers_data:
            question = get_object_or_404(
                Question,
                id=item["question_id"],
                quiz=quiz
            )

            selected_option = get_object_or_404(
                Option,
                id=item["option_id"],
                question=question
            )

            total_marks += question.marks

            is_correct = selected_option.is_correct
            if is_correct:
                obtained_marks += question.marks

            validated_answers.append({
                "question": question,
                "selected_option": selected_option,
                "is_correct": is_correct
            })

        percentage = (
            (obtained_marks / total_marks) * 100
            if total_marks > 0 else 0
        )

        is_passed = percentage >= quiz.pass_percentage

        attempt = UserQuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            score=obtained_marks,
            percentage=round(percentage, 2),
            is_passed=is_passed,
            attempt_number=attempts_count + 1,
            completed_at=timezone.now()
        )

        for ans in validated_answers:
            UserAnswer.objects.create(
                attempt=attempt,
                question=ans["question"],
                selected_option=ans["selected_option"],
                is_correct=ans["is_correct"]
            )

        if is_passed:
            issue_certificate_if_eligible(user, quiz.course)

        logger.info(
            f"Quiz submitted | User: {user.id} | "
            f"Quiz: {quiz.id} | Score: {percentage}% | "
            f"Passed: {is_passed}"
        )

        return Response({
            "score": obtained_marks,
            "percentage": attempt.percentage,
            "is_passed": is_passed,
            "attempt_number": attempt.attempt_number,
            "remaining_attempts": quiz.max_attempts - attempt.attempt_number
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=["get"], url_path="attempts")
    def attempts(self, request, pk=None):
        quiz = self.get_object()
        user = request.user

        if user.role == "instructor":
            attempts = UserQuizAttempt.objects.filter(
                quiz=quiz
            ).select_related("user").order_by("-completed_at")

        elif user.role == "student":
            attempts = UserQuizAttempt.objects.filter(
                quiz=quiz,
                user=user
            ).order_by("-attempt_number")

        else:
            return Response(
                {"error": "Not allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AttemptDetailSerializer(attempts, many=True)
        return Response(serializer.data)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorUser]

    def perform_update(self, serializer):
        question = self.get_object()
        course = question.quiz.course

        if course.status == "submitted":
            raise PermissionDenied(
                "Cannot modify questions while course is under review"
            )
        logger.info(
            f"Question updated | Tutor: {self.request.user.id} | Question: {question.id}"
        )

        serializer.save()

        if not self.request.user.is_staff and course.status == "approved":
            course.status = "submitted"
            course.save(update_fields=["status", "is_published", "updated_at"])


    def perform_destroy(self, instance):
        question = self.get_object()
        course = question.quiz.course

        if course.status == "submitted":
            raise PermissionDenied(
                "Cannot edit questions of submitted courses"
            )
        logger.warning(
            f"Question deleted | Tutor: {self.request.user.id} | Question: {instance.id}"
        )
        instance.delete()  

        if not self.request.user.is_staff and course.status == "approved":
            course.status = "submitted"
            course.save(update_fields=["status", "is_published", "updated_at"])  
