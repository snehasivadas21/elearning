from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import LiveSession
from payment.models import CoursePurchase
from .tasks import send_live_created_email,send_live_started_email,send_live_cancelled_email
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


@receiver(post_save, sender=LiveSession)
def live_session_created(sender, instance, created, **kwargs):
    if not created:
        return

    student_ids = CoursePurchase.objects.filter(
        course=instance.course
    ).values_list("student_id", flat=True)

    send_live_created_email.delay(
        session_id=str(instance.id),
        student_ids=list(student_ids)
    )

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"course_{instance.course.id}",
        {
            "type": "notify",
            "data": {
                "event": "live_created",
                "session_id": str(instance.id),
                "course_id": instance.course.id,
                "title": instance.title,
                "scheduled_at": instance.scheduled_at.isoformat(),
            }
        }
    )

@receiver(post_save, sender=LiveSession)
def live_session_status_changed(sender, instance, created, **kwargs):
    if created:
        return

    if instance.status == "ongoing":
        student_ids = CoursePurchase.objects.filter(
            course=instance.course
        ).values_list("student_id", flat=True)

        send_live_started_email.delay(
            session_id=str(instance.id),
            student_ids=list(student_ids)
        )

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"course_{instance.course.id}",
            {
                "type": "notify",
                "data": {
                    "event": "live_started",
                    "session_id": str(instance.id),
                    "course_id": instance.course.id,
                    "title": instance.title,
                }
            }
        )

    if instance.status == "cancelled":
        student_ids = CoursePurchase.objects.filter(
            course=instance.course
        ).values_list("student_id", flat=True)

        send_live_cancelled_email.delay(
            session_id=str(instance.id),
            student_ids=list(student_ids)
        )

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"course_{instance.course.id}",
            {
                "type": "notify",
                "data": {
                    "event": "live_cancelled",
                    "session_id": str(instance.id),
                    "course_id": instance.course.id,
                    "title": instance.title,
                }
            }
        )
    

