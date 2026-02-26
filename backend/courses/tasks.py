from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Course,LessonResource
from ai.pdf_ingestion import index_lesson_resource

@shared_task
def send_course_status_email(course_id):
    try:
        course = Course.objects.get(id=course_id)

        subject = f"Your course '{course.title}' has been {course.status.upper()}"

        feedback_block = ""
        if course.admin_feedback:
            feedback_block = (
                "\nAdmin Feedback:\n"
                f"{course.admin_feedback}\n"
            )
        message = (
            f"Dear {course.instructor.username},\n\n"
            f"Your course titled '{course.title}' has been reviewed.\n"
            f"New status: {course.status.upper()}.\n"
            f"{feedback_block}\n"
            "You can log in to your dashboard to make changes if required.\n\n"
            "Thanks for using PyTech!❤️"
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

@shared_task
def index_lesson_resource_task(resource_id):
    try:
        resource = LessonResource.objects.get(id=resource_id)
        index_lesson_resource(resource)
    except LessonResource.DoesNotExist:
        print("Resource not found:", resource_id)
    except Exception as e:
        print("Indexing failed:", e)        