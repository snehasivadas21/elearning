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
    file = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "content",
            "file",
            "file_type",
            "is_system",
            "created_at",
            "reply_to",
        ]

    def get_correct_cloudinary_url(self,file_field, file_type):
        if not file_field:
            return None

        url = file_field.url  
        if file_type in ("video", "audio"):
            return url.replace("/auto/upload/", "/video/upload/")
        else: 
            return url.replace("/auto/upload/", "/image/upload/")        

    def get_file(self, obj):
        return self.get_correct_cloudinary_url(obj.file, obj.file_type)    

    def get_reply_to(self, obj):
        if obj.reply_to:
            return {
                "id": str(obj.reply_to.id),
                "sender": obj.reply_to.sender.username,
                "content": obj.reply_to.content[:80],
            }
        return None
    
    def validate_file(self, file):
        if file.size > 20 * 1024 * 1024:
            raise serializers.ValidationError("File too large (max 20MB).")
        allowed = (
            ".jpg",".jpeg",".png",".gif",".webp",
            ".mp4",".mov",".webm",
            ".mp3",".wav",".ogg",
            ".pdf",".doc",".docx",".ppt",".pptx",".zip",".py",".js",".txt"
        )
        if not file.name.lower().endswith(allowed):
            raise serializers.ValidationError("Unsupported file type.")

        return file

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

