from django.db import models
from pgvector.django import VectorField
from courses.models import Course,Lesson,LessonResource
from django.conf import settings
from django.utils import timezone

class CourseEmbedding(models.Model):
    course = models.ForeignKey(Course,on_delete=models.CASCADE,related_name="embeddings")
    lesson = models.ForeignKey(Lesson,on_delete=models.SET_NULL,null=True,blank=True)
    resource = models.ForeignKey(LessonResource,on_delete=models.SET_NULL,null=True,blank=True)
    content = models.TextField()
    embedding = VectorField(dimensions=384)
    source_type = models.CharField(
        max_length=20,
        choices=[
            ("pdf", "PDF"),
            ("video", "Video"),
            ("text", "Text"),
        ]
    )
    is_indexed = models.BooleanField(default=False)
    indexed_at = models.DateTimeField(null=True,blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["course"]),
            models.Index(fields=['lesson']),
        ]

    def __str__(self):
        return f"Embedding - {self.course.title}"    

class ChatSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,limit_choices_to={'role':'student'})
    course = models.ForeignKey(Course,on_delete=models.CASCADE,related_name='chat_sessions')
    lesson = models.ForeignKey(Lesson,on_delete=models.SET_NULL,null=True,blank=True,related_name='chat_sessions')
    created_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=['user','course']),
        ]

    def __str__(self):
        scope = f"Lesson {self.lesson.id}" if self.lesson else "Course"
        return f"{self.user} - {self.course.title} ({scope})"
    
class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ("user","User"),
        ("ai","AI"),
    ]    
    session = models.ForeignKey(ChatSession,on_delete=models.CASCADE,related_name="messages")
    role = models.CharField(max_length=10,choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"    

        