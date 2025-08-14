# livesession/tasks.py
from celery import shared_task
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import LiveSession

@shared_task
def schedule_session_reminder(session_id):
    try:
        s = LiveSession.objects.select_related("course").get(id=session_id, status="scheduled")
    except LiveSession.DoesNotExist:
        return
    if not s.scheduled_at or s.scheduled_at < timezone.now():
        return

    # push reminder to course notify group
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"course_notify_{s.course_id}",
        {"type":"notify.message","payload":{
            "event":"session_reminder",
            "session_id": str(s.id),
            "course_id": s.course_id,
            "title": s.title,
            "starts_at": s.scheduled_at.isoformat(),
            "join_url": f"/student/live/{s.id}"
        }}
    )
    # (optional) also send email here
