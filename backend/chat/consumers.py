import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            logger.warning(f"Unauthenticated WebSocket connection attempt for room {self.room_id}")
            await self.close(code=4003)  
            return

        logger.info(f"User {self.user.username} (authenticated={self.user.is_authenticated}) attempting to connect to room {self.room_id}")

        self.room = await self.get_room()
        if not self.room:
            logger.warning(f"User {self.user.username} denied access to room {self.room_id}")
            await self.close(code=4004)  
            return


        self.room_group_name = f"course_chat_{self.room.id}"
        self.user_room_key = f"user_{self.user.id}_room_{self.room.id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        
        logger.info(f"User {self.user.username} successfully connected to room {self.room_id}")

        has_joined = cache.get(self.user_room_key)
        
        if not has_joined:
            cache.set(self.user_room_key, True, timeout=3600)
            
            await self.send_system_message(
                f"{self.user.username} joined the community"
            )
            logger.info(f"User {self.user.username} joined room {self.room_id} for the first time")
        else:
            logger.info(f"User {self.user.username} reconnected to room {self.room_id}")

    async def disconnect(self, close_code):
        logger.info(f"User {getattr(self.user, 'username', 'Unknown')} disconnected from room {getattr(self, 'room_id', 'Unknown')} with code {close_code}")
        
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

        if hasattr(self, "user_room_key"):
            cache.delete(self.user_room_key)    

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            
            content = data.get("content", data) if isinstance(data, dict) else data
            
            if isinstance(content, dict):
                content = content.get("content", "")
            
            if not isinstance(content, str):
                logger.warning(f"Invalid content type from {self.user.username}: {type(content)}")
                return
                
            content = content.strip()
            
            if not content:
                logger.warning(f"Empty message received from {self.user.username}")
                return

            message = await self.save_message(content)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": await self.serialize_message(message)
                }
            )

            logger.info(f"Message from {self.user.username} in room {self.room_id}: {content[:50]}...")

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON received from {self.user.username}: {e}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid message format"
            }))
        except Exception as e:
            logger.exception(f"WebSocket error for user {self.user.username}: {e}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "An error occurred while processing your message"
            }))

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

            logger.warning(f"User {self.user.username} not authorized for room {self.room_id}")
            return None
            
        except ChatRoom.DoesNotExist:
            logger.error(f"Room {self.room_id} does not exist")
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