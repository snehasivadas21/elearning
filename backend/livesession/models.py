import uuid
from django.db import models
from django.conf import settings
from courses.models import Course

class LiveSession(models.Model):
    STATUS = (("scheduled","Scheduled"), ("ongoing","Ongoing"), ("ended","Ended"))
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="live_sessions")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default="scheduled")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_live_sessions")
    created_at = models.DateTimeField(auto_now_add=True)

class LiveParticipant(models.Model):
    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, default="student")  # "instructor"/"student"
    joined_at = models.DateTimeField(null=True, blank=True)
    left_at = models.DateTimeField(null=True, blank=True)
    is_muted = models.BooleanField(default=False)
    hand_raised = models.BooleanField(default=False)

    class Meta:
        unique_together = ("session","user")
