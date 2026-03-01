from rest_framework.routers import DefaultRouter
from .views import QuizViewSet, QuestionViewSet

router = DefaultRouter()
router.register(r"quizzes", QuizViewSet, basename="quiz")
router.register(r"questions", QuestionViewSet, basename="question")

urlpatterns = router.urls