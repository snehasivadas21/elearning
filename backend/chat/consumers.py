import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        self.room = await self.get_room()
        if not self.room:
            await self.close()
            return

        self.room_group_name = f"course_chat_{self.room.id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send_system_message(
            f"{self.user.username} joined the community"
        )

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            content = data.get("content", "").strip()

            if not content:
                return

            message = await self.save_message(content)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": await self.serialize_message(message)
                }
            )

        except Exception as e:
            logger.exception(f"WebSocket error: {e}")
    
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"]
        }))

    @database_sync_to_async
    def get_room(self):
        from .models import ChatRoom

        try:
            room = ChatRoom.objects.select_related("course").get(
                id=self.room_id,
                is_active=True
            )

            if (
                room.course.purchases.filter(student_id=self.user.id).exists()
                or room.course.instructor_id == self.user.id
            ):
                return room

            return None
        except ChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def save_message(self, content):
        from .models import Message

        return Message.objects.create(
            room=self.room,
            sender=self.user,
            content=content
        )
    
    @database_sync_to_async
    def serialize_message(self, message):
        return {
            "id": str(message.id),
            "content": message.content,
            "sender": {
                "id": message.sender.id,
                "username": message.sender.username,
            },
            "created_at": message.created_at.isoformat(),
            "is_system": message.is_system,
        }
    
    async def send_system_message(self, text):
        message = await self.create_system_message(text)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": await self.serialize_message(message)
            }
        )

    @database_sync_to_async
    def create_system_message(self, text):
        from .models import Message

        return Message.objects.create(
            room=self.room,
            sender=self.user,
            content=text,
            is_system=True
    )




