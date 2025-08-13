from django.db import models
from django.conf import settings
import uuid
from courses.models import Course
from django.utils import timezone

class LiveSession(models.Model):
    course = models.ForeignKey(Course,on_delete=models.CASCADE,related_name="live_session")
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="hosted_sessions")
    title = models.CharField(max_length=255)
    scheduled_datetime = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    meeting_link = models.URLField()
    unique_room_id = models.CharField(max_length=255,unique=True,default=uuid.uuid4)
    is_recurring = models.BooleanField(default=True)
    created_at= models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.course.title})"

    class Meta:
        ordering = ['scheduled_datetime']


class ChatMessage(models.Model):
    session = models.ForeignKey(LiveSession,on_delete=models.CASCADE,related_name='messages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE) 
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)    

    def __str__(self):
        return f"{self.user.username} : {self.content[:30]}"