from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from cloudinary.models import CloudinaryField
from cloudinary_storage.storage import MediaCloudinaryStorage
from django.db.models import Sum

class CourseCategory(models.Model):
    name = models.CharField(max_length=255,unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at=models.DateTimeField(default=timezone.now)
    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Course(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted for Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    LEVEL_CHOICES =[
        ('beginner','Beginner'),
        ('intermediate','Intermediate'),
        ('advanced','Advanced'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'instructor'},
        related_name='courses'
    )
    category = models.ForeignKey(
        CourseCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    level = models.CharField(max_length=20,choices=LEVEL_CHOICES,default='beginner')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    course_image = CloudinaryField('course_image', blank=True, null=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=0.0)
    price = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    admin_feedback = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['category'])
        ]

    def __str__(self):
        return self.title
    
    def get_total_duration(self):
        total = 0
        for module in self.modules.all():
            total += module.get_total_duration()
        return total

class Module(models.Model):
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['order'] 

    def __str__(self):
        return f"{self.course.title} - {self.title}"
    
    def get_total_duration(self):
        total = self.lessons.aggregate(
            total=Sum("duration")
        )["total"]
        return total or 0

class Lesson(models.Model):
    VIDEO_SOURCE_CHOICES = [
        ('youtube', 'YouTube'),
        ('cloud', 'Cloudinary'),
    ]
    CONTENT_TYPE_CHOICES = [
        ('video', 'Video'),
        ('text', 'Text'),
    ]
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    content_type = models.CharField(
        max_length=20,
        choices=CONTENT_TYPE_CHOICES,
    )
    video_source = models.CharField(
        max_length=20,
        choices=VIDEO_SOURCE_CHOICES,
        blank=True,
        null=True
    )
    video_url = models.URLField(blank=True, null=True)
    duration = models.PositiveIntegerField(null=True,blank=True,help_text="Duration in seconds")
    text_content = models.TextField(blank=True, null=True)
    
    order = models.PositiveIntegerField(default=0)
    is_preview = models.BooleanField(default=False) 
    is_active = models.BooleanField(default=True) 
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"

class LessonResource(models.Model):
    lesson = models.ForeignKey(Lesson,on_delete=models.CASCADE,related_name='resources')
    title = models.CharField(max_length=255)
    file = models.FileField(storage=MediaCloudinaryStorage(),upload_to='lesson_resources/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.lesson.title})"

class LessonProgress(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson,on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True,blank=True)
    watched_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('student','lesson')
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['lesson']),
        ]
class CourseCertificate(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="certificates"
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    certificate_id = models.CharField(max_length=20, unique=True)
    certificate_file = models.FileField(upload_to="certificates/",storage=MediaCloudinaryStorage(),null=True,blank=True)
    issued_at = models.DateTimeField()

    class Meta:
        unique_together = ("student", "course")
        indexes = [
            models.Index(fields=["certificate_id"]),
            models.Index(fields=["student"]),
        ]

class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="reviews")
    course = models.ForeignKey(Course,on_delete=models.CASCADE,related_name="reviews")
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "course")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.course} ({self.rating})"
