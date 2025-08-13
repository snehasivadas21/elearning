from rest_framework.routers import DefaultRouter
from .views import QuizViewSet,QuestionViewSet,ChoiceViewSet,QuizSubmissionViewSet,StudentQuizProgressViewSet

router = DefaultRouter()

router.register(r'quizzes', QuizViewSet, basename='quizzes')
router.register(r'questions', QuestionViewSet, basename='questions')
router.register(r'choices', ChoiceViewSet, basename='choices')
router.register(r'submit', QuizSubmissionViewSet, basename='quiz-submission')
router.register(r'quiz-progress', StudentQuizProgressViewSet, basename='quiz-progress')

urlpatterns = router.urls