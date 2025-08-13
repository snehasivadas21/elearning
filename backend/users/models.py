from django.db import models
from django.contrib.auth.models import AbstractBaseUser,BaseUserManager,PermissionsMixin
import random
from django.utils import timezone
from datetime import timedelta
from cloudinary.models import CloudinaryField

# Create your models here.
class CustomUserManager(BaseUserManager):
    def create_user(self,email,username,password=None,role='student',**extra_fields):
        if not email:
            raise ValueError("Email is required")
        if not username:
            raise ValueError("Username is required")
        email=self.normalize_email(email)
        user=self.model(email=email,username=username,role=role,**extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, username, password, **extra_fields)
    
class CustomUser(AbstractBaseUser,PermissionsMixin):
    ROLE_CHOICES= (
        ('student','Student'),
        ('instructor','Instructor'),
        ('recruiter','Recruiter'),
        ('admin','Admin'),
    ) 
    email=models.EmailField(unique=True)
    username=models.CharField(max_length=150,unique=True)
    role=models.CharField(max_length=20,choices=ROLE_CHOICES,default='student')
    is_active=models.BooleanField(default=True)
    is_staff=models.BooleanField(default=False)
    date_joined=models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    objects=CustomUserManager()

    USERNAME_FIELD='email'
    REQUIRED_FIELDS=['username']

    def __str__(self):
        return self.username
    
class EmailOTP(models.Model):
    user=models.OneToOneField(CustomUser,on_delete=models.CASCADE)
    otp=models.CharField(max_length=6)
    created_at=models.DateTimeField(auto_now_add=True)
    expires_at=models.DateTimeField()
    used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now()>self.expires_at
    def save(self,*args,**kwargs):
        if not self.otp:
            self.otp=str(random.randint(100000,999999))
        if not self.expires_at:
            self.expires_at=timezone.now()+timedelta(minutes=2)
        return super().save(*args,**kwargs)   
    
    def __str__(self):
        return f"OTP for {self.user.email}"   

class StudentProfile(models.Model):
    user = models.OneToOneField(CustomUser,on_delete=models.CASCADE,related_name='student_profile')
    profile_picture =  CloudinaryField('profile_picture',blank=True,null=True) 
    bio = models.TextField(blank=True)
    dob = models.DateField(blank=True,null=True)
    phone = models.CharField(max_length=15,blank=True)

    def __str__(self):
        return f"{self.user.username}'s profile"   

    

        
# Create your models here.
