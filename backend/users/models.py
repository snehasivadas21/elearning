from django.db import models
from django.contrib.auth.models import AbstractBaseUser,BaseUserManager,PermissionsMixin
from cloudinary.models import CloudinaryField

# Create your models here.
class CustomUserManager(BaseUserManager):
    def create_user(self,email,username=None,password=None,role='student',**extra_fields):
        if not email:
            raise ValueError("Email is required")
        email=self.normalize_email(email)
        if not username:
            username = email.split('@')[0]
               
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
    
class Profile(models.Model):
    user = models.OneToOneField(CustomUser,on_delete=models.CASCADE,related_name="profile")

    full_name = models.CharField(max_length=150)
    bio = models.TextField(blank=True)
    headline = models.CharField(max_length=255,blank=True)
    profile_image = CloudinaryField('image', blank=True, null=True)

    date_of_birth = models.DateField(null=True,blank=True)
    location = models.CharField(max_length=100,blank=True)

    experience = models.PositiveIntegerField(default=0)
    resume = CloudinaryField('file', blank=True, null=True)
    skills = models.TextField(help_text="Common separated skills",blank=True)

    def __str__(self):
        return self.full_name

class ProfileLink(models.Model):
    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="links"
    )

    label = models.CharField(max_length=50) 
    url = models.URLField()

    def __str__(self):
        return f"{self.label} - {self.profile.full_name}"
