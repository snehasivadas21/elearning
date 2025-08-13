# from allauth.account.signals import user_signed_up
from django.dispatch import receiver
from django.db.models.signals import post_save
from .models import CustomUser,StudentProfile

# @receiver(user_signed_up)
# def verify_social_user(sender,request,user,**kwargs):
#     user.is_verified=True
#     user.save()

@receiver(post_save,sender=CustomUser)
def create_student_profile(sender,instance,created,**kwargs):
    if created and instance.role == 'student':
        StudentProfile.objects.create(user=instance)    