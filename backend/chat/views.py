from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from django.db.models import Max,Q
from django.shortcuts import get_object_or_404
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
import logging

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
