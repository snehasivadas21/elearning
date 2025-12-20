from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import CustomUser
from django.contrib.auth.tokens import PasswordResetTokenGenerator

@shared_task
def send_verification_email_task(user_id):
    user = CustomUser.objects.get(id=user_id)
    token = PasswordResetTokenGenerator().make_token(user)

    link = f"{settings.FRONTEND_URL}/verify-email?uid={user.id}&token={token}"

    send_mail(
        "Verify your email",
        f"Click to verify: {link}",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False
    )