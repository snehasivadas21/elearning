from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message

User = get_user_model()
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name']
    
    def get_full_name(self, obj):
        return obj.username
    

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    reply_to = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "content",
            "is_system",
            "created_at",
            "reply_to",
        ]

    def get_reply_to(self, obj):
        if obj.reply_to:
            return {
                "id": str(obj.reply_to.id),
                "sender": obj.reply_to.sender.username,
                "content": obj.reply_to.content[:80],
            }
        return None

class ChatRoomSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    participants_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            "id",
            "course",
            "course_title",
            "participants_count",
            "last_message",
            "unread_count",
            "created_at",
            "is_active",
        ]

    def get_participants_count(self, obj):
        if not obj.course:
            return 0

        return obj.course.purchases.count() + 1

    def get_last_message(self, obj):
        message = obj.messages.filter(is_system=False).order_by("-created_at").first()
        if message:
            return MessageSerializer(
                message,
                context=self.context
            ).data
        return None
    
    def get_unread_count(self, obj):
        user = self.context["request"].user
        return obj.messages.filter(
            is_system=False,
            is_read=False
        ).exclude(sender=user).count()

