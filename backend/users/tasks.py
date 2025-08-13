from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

@shared_task
def send_otp_email_task(email, otp_code):
    print(f"[✅ CELERY] Sent OTP {otp_code} to {email}")
    send_mail(
        subject='Verify your email',
        message=f'Your OTP is {otp_code}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
    