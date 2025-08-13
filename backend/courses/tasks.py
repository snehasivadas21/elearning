from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Course

@shared_task
def send_course_status_email(course_id):
    try:
        course = Course.objects.get(id=course_id)
        subject = f"Your course '{course.title}' has been {course.status.upper()}"
        message = (
            f"Dear {course.instructor.username},\n\n"
            f"Your course titled '{course.title}' has been reviewed.\n"
            f"New status: {course.status.upper()}.\n\n"
            "Thanks for using PyTech!"
        )
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [course.instructor.email],
            fail_silently=True
        )
    except Course.DoesNotExist:
        print("Course not found for email task.")