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

    subject = "Verify your email"

    message = f"""

    Hi {user.username},

    Welcome to PyTech ❤️
    Thanks for creating an account with us. To get started, please verify your email address by clicking the link below:
    {link}

    Best regards,
    The PyTech Team
    """

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False
    )
