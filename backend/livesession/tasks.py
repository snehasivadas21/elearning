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
def schedule_session_reminder(session_id):
    try:
        s = LiveSession.objects.select_related("course").get(
            id=session_id, status="scheduled", notification_sent=False
        )
    except LiveSession.DoesNotExist:
        return

    if not s.scheduled_at or s.scheduled_at < timezone.now():
        return

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"course_notify_{s.course_id}",
        {
            "type": "notify.message",
            "payload": {
                "event": "session_reminder",
                "session_id": str(s.id),
                "course_id": s.course_id,
                "starts_at": s.scheduled_at.isoformat(),
            }
        }
    )

    s.notification_sent = True
    s.save(update_fields=["notification_sent"])
