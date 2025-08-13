from django.shortcuts import render
from rest_framework import permissions,viewsets
from users.permissions import IsInstructorUser,IsStudentUser
from .models import Question,Quiz,Choice,QuizSubmission
from .serializers import QuizSerializer,QuestionSerializer,ChoiceSerializer,QuizProgressSerializer,QuizSubmissionSerializer


class QuizViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorUser]

    def get_queryset(self):
        return Quiz.objects.filter(module__course__instructor=self.request.user)

    def perform_create(self, serializer):
        serializer.save()


class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorUser]

    def get_queryset(self):
        return Question.objects.filter(quiz__module__course__instructor=self.request.user)

    def perform_create(self, serializer):
        serializer.save()


class ChoiceViewSet(viewsets.ModelViewSet):
    serializer_class = ChoiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorUser]

    def get_queryset(self):
        return Choice.objects.filter(question__quiz__module__course__instructor=self.request.user)

    def perform_create(self, serializer):
        serializer.save()

class QuizSubmissionViewSet(viewsets.ModelViewSet):
    queryset = QuizSubmission.objects.all()
    serializer_class = QuizSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(student=self.request.user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)        

class StudentQuizProgressViewSet(viewsets.ModelViewSet):
    serializer_class = QuizProgressSerializer
    permission_classes = [permissions.IsAuthenticated,IsStudentUser]

    def get_queryset(self):
        return QuizSubmission.objects.filter(student=self.request.user)