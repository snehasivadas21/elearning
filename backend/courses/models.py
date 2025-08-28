from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from cloudinary.models import CloudinaryField
from cloudinary_storage.storage import MediaCloudinaryStorage

class CourseCategory(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Course(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted for Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
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
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    course_image = CloudinaryField('course_image', blank=True, null=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=0.0)
    price = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    is_free = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class Module(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted for Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    status = models.CharField(max_length=20,choices=STATUS_CHOICES,default='draft')

    class Meta:
        ordering = ['order'] 

    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Lesson(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted for Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    content_type = models.CharField(max_length=20, choices=[
        ('video', 'Video'),
        ('text', 'Text'),
        ('quiz', 'Quiz'),
    ], default='video')
    content_url = models.URLField(blank=True,null=True) 
    order = models.PositiveIntegerField(default=0)
    is_preview = models.BooleanField(default=False) 
    is_active = models.BooleanField(default=True) 
    is_deleted = models.BooleanField(default=False)
    status = models.CharField(max_length=20,choices=STATUS_CHOICES,default='draft')

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"
    
    
class LessonProgress(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,limit_choices_to={'role':'student'})
    lesson = models.ForeignKey(Lesson,on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True,blank=True)

    class Meta:
        unique_together = ('student','lesson')

    def mark_completed(self):
        self.completed = True
        self.completed_at = timezone.now()
        self.save()    

    def __str__(self):
        return f"{self.student.username} - {self.lesson.title} - {'YES' if self.completed else 'NO'}"    

class CourseCertificate(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certificates')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificates')
    certificate_file = models.FileField(upload_to='certificates/', null=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    certificate_id = models.CharField(max_length=12, unique=True)

    class Meta:
        unique_together = ['student', 'course']

    def __str__(self):
        return f"Certificate - {self.student.email} - {self.course.title}"

class LessonResource(models.Model):
    lesson = models.ForeignKey(Lesson,on_delete=models.CASCADE,related_name='resources')
    title = models.CharField(max_length=255)
    file = models.FileField(storage=MediaCloudinaryStorage(),upload_to='lesson_resources/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.lesson.title})"
    
class CourseReview(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    course = models.ForeignKey(Course,on_delete=models.CASCADE,related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1),MaxValueValidator(5)])
    review = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at= models.DateTimeField(auto_now=True)

    class Meta:
        unique_together =['student','course']

    def __str__(self):
        return f"{self.student.email} - {self.course.title} ({self.rating})"
        