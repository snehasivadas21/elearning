from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import LiveSession
from payment.models import CoursePurchase
from .tasks import send_live_created_email


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
