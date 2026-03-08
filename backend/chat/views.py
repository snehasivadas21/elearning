from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from django.db.models import Max,Q
from django.shortcuts import get_object_or_404
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
import logging
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

logger = logging.getLogger(__name__)

User = get_user_model()

class MessagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class MyCourseChatRoomsView(generics.ListAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        student = self.request.user

        logger.info(
            f"User {student.id} fetching their chat rooms"
        )

        return (
            ChatRoom.objects
            .filter(is_active=True)
            .filter(
                Q(course__purchases__student=student) |
                Q(course__instructor=student)
            )
            .annotate(
                last_message_time=Max("messages__created_at")
            )
            .order_by("-last_message_time")
            .distinct()
        )

class ChatRoomDetailView(generics.RetrieveAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        student = self.request.user

        logger.info(
            f"User {student.id} trying to access chat room details"
        )

        return ChatRoom.objects.filter(
            is_active=True
        ).filter(
            course__purchases__student=student
        ) | ChatRoom.objects.filter(
            course__instructor=student
        )

class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MessagePagination

    def get_queryset(self):
        room_id = self.kwargs["room_id"]
        user = self.request.user
        
        try:
            room = get_object_or_404(
                ChatRoom,
                id=room_id,
                is_active=True
            )

            logger.info(
                f"User {user.id} requesting messages for room {room_id}"
            )

            if not (
                room.course.purchases.filter(student_id=user.id).exists()
                or room.course.instructor_id == user.id
            ):
                logger.warning(
                    f"Unauthorized access attempt: "
                    f"User {user.id} tried accessing room {room_id}"
                )
                return Message.objects.none()

            return room.messages.select_related(
                "sender",
                "reply_to"
            ).order_by("-created_at")
        
        except Exception as e:
            logger.error(
                f"Error fetching messages for room {room_id} "
                f"by user {user.id}: {str(e)}"
            )
            raise

class ChatFileUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, room_id):
        try:
            room = ChatRoom.objects.select_related("course").get(
                id=room_id,
                is_active=True
            )
        except ChatRoom.DoesNotExist:
            return Response({"error": "Room not found"}, status=404)

        user = request.user

        is_student = room.course.purchases.filter(student=user).exists()
        is_instructor = room.course.instructor_id == user.id

        if not (is_student or is_instructor):
            return Response({"error": "Not authorized"}, status=403)

        file = request.FILES.get("file")
        content = request.data.get("content", "")
        reply_to_id = request.data.get("reply_to_id")

        if not file and not content.strip():
            return Response({"error": "File or content required"}, status=400)

        file_type = ""

        if file:
            if file.size > 20 * 1024 * 1024:
                return Response({"error": "File too large (max 20MB)"}, status=400)

            allowed = (
                ".jpg",".jpeg",".png",".gif",".webp",
                ".mp4",".mov",".webm",
                ".mp3",".wav",".ogg",
                ".pdf",".doc",".docx",".ppt",".pptx",
                ".zip",".py",".js",".txt"
            )

            if not file.name.lower().endswith(allowed):
                return Response({"error": "Unsupported file type"}, status=400)

            name = file.name.lower()

            if name.endswith((".jpg",".jpeg",".png",".gif",".webp")):
                file_type = "image"
            elif name.endswith((".mp4",".mov",".webm")):
                file_type = "video"
            elif name.endswith((".mp3",".wav",".ogg")):
                file_type = "audio"
            else:
                file_type = "document"

        reply_to = None
        if reply_to_id:
            try:
                reply_to = Message.objects.get(id=reply_to_id)
            except Message.DoesNotExist:
                pass

        message = Message.objects.create(
            room=room,
            sender=user,
            content=content,
            file=file,
            file_type=file_type,
            reply_to=reply_to,
        )

        participants = set()

        students = room.course.purchases.values_list("student", flat=True)
        participants.update(students)

        participants.add(room.course.instructor_id)

        participants.discard(user.id)

        from instrpanel.models import Notification

        notifications = [
            Notification(
                user_id=user_id,
                title="New chat message",
                message=f"{user.username}: {content[:50] if content else 'sent a file'}",
                notification_type="chat",
            )
            for user_id in participants
        ]

        Notification.objects.bulk_create(notifications)

        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()

        for user_id in participants:
            async_to_sync(channel_layer.group_send)(
                f"user_{user_id}",
                {
                    "type": "chat_notification",
                    "room_id": str(room.id),
                },
            )

        return Response(
            {"message": MessageSerializer(message, context={"request": request}).data},
            status=201
        )