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
            cache.set(self.user_room_key, True, timeout=86400)
            
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
            participants = await self.get_participants(message)

            await self.create_chat_notifications(message,participants)

            for user_id in participants:
                await self.channel_layer.group_send(
                    f"user_{user_id}",
                    {
                        "type": "chat_notification",
                        "room_id": str(self.room.id),
                    }
                )

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

    async def chat_notification(self, event):
        pass    


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
    
    @database_sync_to_async
    def get_participants(self, message):

        room = message.room
        sender = message.sender

        participants = set()

        students = room.course.purchases.values_list("student", flat=True)
        participants.update(students)

        participants.add(room.course.instructor_id)

        participants.discard(sender.id)

        return list(participants)
    
    @database_sync_to_async
    def create_chat_notifications(self, message, participants):
        from instrpanel.models import Notification

        notifications = [
            Notification(
                user_id=user_id,
                title="New chat message",
                message=f"{message.sender.username}: {message.content[:50]}",
                notification_type="chat",
            )
            for user_id in participants
        ]

        Notification.objects.bulk_create(notifications)
    
    @database_sync_to_async
    def create_system_message(self, text):
        from .models import Message

        return Message.objects.create(
            room=self.room,
            sender=self.user,
            content=text,
            is_system=True
        )
    
    async def send_system_message(self, text):
        message = await self.create_system_message(text)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": await self.serialize_message(message)
            }
        )

class UserNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f"user_{self.user.id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def chat_notification(self, event):
        await self.send(text_data=json.dumps({
            "event": "new_message",
            "room_id": event["room_id"],
        }))
  