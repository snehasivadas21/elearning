from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from courses.models import Course  
import uuid

User=get_user_model()

class ChatRoom(models.Model):
    ROOM_TYPES = (
        ('course', 'Course Group Chat'),
        ('direct', 'Direct Message'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES)
    course = models.OneToOneField(Course, on_delete=models.CASCADE, null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    # For direct messages - store the two participants
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='chat_rooms', blank=True)
    
    class Meta:
        db_table = 'chat_rooms'
        indexes = [
            models.Index(fields=['room_type', 'is_active']),
            models.Index(fields=['course']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_room_type_display()})"
    
    @property
    def room_group_name(self):
        """Generate unique group name for WebSocket"""
        return f"chat_{self.id}"
    
    def get_participants_count(self):
        if self.room_type == 'course' and self.course:
            return self.course.enrolled_students.count()
        return self.participants.count()

class Message(models.Model):
    MESSAGE_TYPES = (
        ('text', 'Text Message'),
        ('file', 'File Attachment'),
        ('image', 'Image'),
        ('system', 'System Message'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    content = models.TextField(blank=True)
    file_url = models.URLField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    
    # For reply functionality
    reply_to = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    class Meta:
        db_table = 'chat_messages'
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['room', 'timestamp']),
            models.Index(fields=['sender', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.sender.username} in {self.room.name}: {self.content[:50]}"

class MessageReadStatus(models.Model):
    """Track which messages have been read by which users"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_statuses')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_read_statuses')
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'message_read_status'
        unique_together = ['message', 'user']
        indexes = [
            models.Index(fields=['user', 'read_at']),
        ]

class UserOnlineStatus(models.Model):
    """Track user online/offline status"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='online_status')
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)
    current_room = models.ForeignKey(ChatRoom, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'user_online_status'