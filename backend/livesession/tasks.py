from celery import shared_task
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import LiveSession
from django.contrib.auth import get_user_model
from django.core.mail import send_mail


User = get_user_model()

@shared_task
def send_live_created_email(session_id, student_ids):
    try:
        session = LiveSession.objects.select_related("course").get(id=session_id)
    except LiveSession.DoesNotExist:
        return

    students = User.objects.filter(id__in=student_ids)

    for student in students:
        send_mail(
            subject=f"📢 New Live Session: {session.title}",
            message=(
                f"Hi {student.username},\n\n"
                f"A new live session has been scheduled.\n\n"
                f"📅 {session.scheduled_at}\n"
                f"🎓 Course: {session.course.title}\n\n"
                f"Login to join when it starts."
            ),
            from_email="noreply@pytech.com",
            recipient_list=[student.email],
            fail_silently=True,
        )

@shared_task
def send_live_started_email(session_id, student_ids):
    try:
        session = LiveSession.objects.select_related("course").get(id=session_id)
    except LiveSession.DoesNotExist:
        return

    students = User.objects.filter(id__in=student_ids)

    for student in students:
        send_mail(
            subject=f"🚀 Live Session Started: {session.title}",
            message=(
                f"Hi {student.username},\n\n"
                f"The live session has started now.\n\n"
                f"🎓 Course: {session.course.title}\n"
                f"📢 Join immediately to attend.\n\n"
                f"See you there!"
            ),
            from_email="noreply@pytech.com",
            recipient_list=[student.email],
            fail_silently=True,
        )

@shared_task
def send_live_cancelled_email(session_id, student_ids):
    try:
        session = LiveSession.objects.select_related("course").get(id=session_id)
    except LiveSession.DoesNotExist:
        return

    students = User.objects.filter(id__in=student_ids)

    for student in students:
        send_mail(
            subject=f"❌ Live Session Cancelled: {session.title}",
            message=(
                f"Hi {student.username},\n\n"
                f"Unfortunately, the live session has been cancelled.\n\n"
                f"🎓 Course: {session.course.title}\n"
                f"We’ll notify you if it is rescheduled."
            ),
            from_email="noreply@pytech.com",
            recipient_list=[student.email],
            fail_silently=True,
        )
