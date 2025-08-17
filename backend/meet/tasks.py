from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

@shared_task
def send_mock_interview_reminder(interview_id):
    from .models import MockInterview
    interview = MockInterview.objects.get(id=interview_id)
    subject = "Mock Interview Reminder - PyTech"
    message = f"""
    You have a mock interview scheduled for:

    Course: {interview.course_title}
    Time: {interview.scheduled_at}
    Meet Link: {interview.meet_link or 'To be provided soon'}

    Please be prepared.
    """
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [interview.student_email],fail_silently=False)

    interview.reminder_sent = True
    interview.save(update_fields=["reminder_sent"])