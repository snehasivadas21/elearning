from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message, MessageReadStatus, UserOnlineStatus

User = get_user_model()
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'is_online']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
    
    def get_is_online(self, obj):
        try:
            return obj.online_status.is_online
        except UserOnlineStatus.DoesNotExist:
            return False

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    reply_to = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'message_type', 'file_url', 
                 'timestamp', 'is_edited', 'edited_at', 'reply_to', 'is_read']
    
    def get_reply_to(self, obj):
        if obj.reply_to:
            return {
                'id': str(obj.reply_to.id),
                'sender': obj.reply_to.sender.username,
                'content': obj.reply_to.content[:100] + ('...' if len(obj.reply_to.content) > 100 else '')
            }
        return None
    
    def get_is_read(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return MessageReadStatus.objects.filter(
                message=obj, user=request.user
            ).exists()
        return False

class ChatRoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    participants_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'room_type', 'course', 'course_title', 
                 'participants', 'participants_count', 'last_message', 
                 'unread_count', 'created_at', 'is_active']
    
    def get_participants_count(self, obj):
        if obj.room_type == 'course' and obj.course:
            return obj.course.enrolled_students.count() + 1  # +1 for instructor
        return obj.participants.count()
    
    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return MessageSerializer(last_message, context=self.context).data
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.exclude(
                read_statuses__user=request.user
            ).count()
        return 0
    
    def get_course_title(self, obj):
        return obj.course.title if obj.course else None