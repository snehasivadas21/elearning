from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

@shared_task
def send_mock_interview_reminder(student_email, course_title, scheduled_at, meet_link):
    subject = "Mock Interview Reminder - PyTech"
    message = f"""
    You have a mock interview scheduled for:

    Course: {course_title}
    Time: {scheduled_at}
    Meet Link: {meet_link or 'To be provided soon'}

    Please be prepared.
    """
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [student_email])