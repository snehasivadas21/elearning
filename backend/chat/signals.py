from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ChatRoom
from courses.models import Course


@receiver(post_save, sender=Course)
def create_course_chat_room(sender, instance, created, **kwargs):
    """Automatically create a chat room when a course is created"""
    if created:
        ChatRoom.objects.create(
            name=f"{instance.title} - Course Discussion",
            room_type='course',
            course=instance,
            created_by=instance.instructor  
        )
