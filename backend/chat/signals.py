from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ChatRoom
from courses.models import Course


@receiver(post_save, sender=Course)
def create_course_chat_room(sender, instance, created, **kwargs):
    if not created:
        return

    ChatRoom.objects.create(
        course=instance,
        name=f"{instance.title} – Community",
        created_by=instance.instructor
    )

