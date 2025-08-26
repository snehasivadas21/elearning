from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Job, Application, Notification
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=Application)
def notify_recruiter_on_new_application(sender, instance, created, **kwargs):
    if created:
        # Notify recruiter when new application is submitted
        recruiter = instance.job.recruiter
        Notification.objects.create(
            user=recruiter,
            message=f"New application received for {instance.job.title}"
        )

@receiver(post_save, sender=Application)
def notify_applicant_on_status_change(sender, instance, created, **kwargs):
    if not created:  # status updated
        Notification.objects.create(
            user=instance.applicant,
            message=f"Your application for {instance.job.title} is {instance.status}"
        )

@receiver(post_save, sender=Job)
def notify_admin_on_new_job(sender, instance, created, **kwargs):
    if created:
        # Optional: notify admin if needed
        admins = User.objects.filter(role="admin")
        for admin in admins:
            Notification.objects.create(
                user=admin,
                message=f"New job posted: {instance.title}"
            )
