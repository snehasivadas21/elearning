from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from .models import LiveSession

@receiver(post_save, sender=LiveSession)
def notify_students_on_session_created(sender, instance, created, **kwargs):
    if created:
        enrolled_students = instance.course.enrolled_students.all()
        for student in enrolled_students:
            send_mail(
                subject=f"📢 New Live Session for {instance.course.title}",
                message=(
                    f"Hello {student.username},\n\n"
                    f"A new live session titled \"{instance.title}\" is scheduled on "
                    f"{instance.scheduled_datetime.strftime('%Y-%m-%d %H:%M')}.\n\n"
                    f"Meeting Link: {instance.meeting_link}\n\n"
                    f"- PyTech Team"
                ),
                from_email='noreply@pytech.com',
                recipient_list=[student.email],
                fail_silently=True
            )