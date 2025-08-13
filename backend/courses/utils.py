from django.utils import timezone
from .models import CourseCertificate
from .models import Lesson, LessonProgress
from payment.models import CoursePurchase
from quiz.models import QuizSubmission

def issue_certificate_if_eligible(student, course):
    # Already issued?
    if CourseCertificate.objects.filter(student=student, course=course).exists():
        return

    # All lessons completed?
    total_lessons = Lesson.objects.filter(module__course=course, is_active=True).count()
    completed_lessons = LessonProgress.objects.filter(student=student, lesson__module__course=course).count()
    if total_lessons == 0 or completed_lessons < total_lessons:
        return

    # Quiz check (optional threshold)
    quiz_submissions = QuizSubmission.objects.filter(student=student, quiz__module__course=course)
    if not quiz_submissions.exists() or any(sub.score < 50 for sub in quiz_submissions):
        return

    # If course is paid, ensure it's purchased
    if not course.is_free:
        if not CoursePurchase.objects.filter(student=student, course=course, is_paid=True).exists():
            return

    # All checks passed — issue certificate
    CourseCertificate.objects.create(student=student, course=course, issued_at=timezone.now())