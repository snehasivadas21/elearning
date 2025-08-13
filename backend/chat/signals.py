from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ChatRoom, RoomParticipant
from courses.models import Course
from payment.models import CoursePurchase

@receiver(post_save, sender=Course)
def create_course_room(sender, instance, created, **kwargs):
    if created and not ChatRoom.objects.filter(type="course", course=instance).exists():
        ChatRoom.objects.create(type="course", course=instance, name=f"{instance.title} Chat")

@receiver(post_save, sender=CoursePurchase)
def add_enrollee_to_room(sender, instance, created, **kwargs):
    if created:
        room = ChatRoom.objects.filter(type="course", course=instance.course).first()
        if room:
            RoomParticipant.objects.get_or_create(room=room, user=instance.user)

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
