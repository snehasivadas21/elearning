import json
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.core.serializers import serialize
from .models import ChatRoom, Message, MessageReadStatus, UserOnlineStatus
from .serializers import MessageSerializer
import logging

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get room ID from URL route
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']
        
        # Reject connection if user is not authenticated
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Check if user has permission to join this room
        has_permission = await self.check_room_permission()
        if not has_permission:
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Update user online status
        await self.update_user_online_status(True)
        
        # Notify others that user joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_status_update',
                'user_id': self.user.id,
                'username': self.user.username,
                'status': 'online',
                'message': f'{self.user.username} joined the chat'
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            # Update user online status
            await self.update_user_online_status(False)
            
            # Notify others that user left
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_status_update',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'status': 'offline',
                    'message': f'{self.user.username} left the chat'
                }
            )
            
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'chat_message':
                await self.handle_chat_message(data)
            elif message_type == 'typing_indicator':
                await self.handle_typing_indicator(data)
            elif message_type == 'mark_as_read':
                await self.handle_mark_as_read(data)
            elif message_type == 'edit_message':
                await self.handle_edit_message(data)
            elif message_type == 'delete_message':
                await self.handle_delete_message(data)
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error in receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'error': 'An error occurred processing your message'
            }))

    async def handle_chat_message(self, data):
        content = data.get('content', '').strip()
        reply_to_id = data.get('reply_to_id')
        
        if not content:
            return
        
        # Save message to database
        message = await self.save_message(content, reply_to_id)
        
        if message:
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message_broadcast',
                    'message': await self.serialize_message(message)
                }
            )

    async def handle_typing_indicator(self, data):
        is_typing = data.get('is_typing', False)
        
        # Broadcast typing status to others (exclude sender)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator_broadcast',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_typing': is_typing,
                'sender_channel': self.channel_name
            }
        )

    async def handle_mark_as_read(self, data):
        message_id = data.get('message_id')
        if message_id:
            await self.mark_message_as_read(message_id)

    async def handle_edit_message(self, data):
        message_id = data.get('message_id')
        new_content = data.get('content', '').strip()
        
        if message_id and new_content:
            message = await self.edit_message(message_id, new_content)
            if message:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'message_edited_broadcast',
                        'message': await self.serialize_message(message)
                    }
                )

    # WebSocket message handlers
    async def chat_message_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))

    async def user_status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_status',
            'user_id': event['user_id'],
            'username': event['username'],
            'status': event['status'],
            'message': event['message']
        }))

    async def typing_indicator_broadcast(self, event):
        # Don't send typing indicator back to sender
        if event['sender_channel'] != self.channel_name:
            await self.send(text_data=json.dumps({
                'type': 'typing_indicator',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing']
            }))

    async def message_edited_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_edited',
            'message': event['message']
        }))

    # Database operations
    @database_sync_to_async
    def check_room_permission(self):
        """Check if user has permission to access this chat room"""
        try:
            room = ChatRoom.objects.get(id=self.room_id, is_active=True)
            
            if room.room_type == 'course':
                # Check if user is enrolled in the course or is the instructor
                return (room.course.enrolled_students.filter(id=self.user.id).exists() or 
                       room.course.instructor == self.user)
            elif room.room_type == 'direct':
                # Check if user is one of the participants
                return room.participants.filter(id=self.user.id).exists()
            
            return False
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content, reply_to_id=None):
        """Save message to database"""
        try:
            room = ChatRoom.objects.get(id=self.room_id, is_active=True)
            
            reply_to = None
            if reply_to_id:
                try:
                    reply_to = Message.objects.get(id=reply_to_id, room=room)
                except Message.DoesNotExist:
                    pass
            
            message = Message.objects.create(
                room=room,
                sender=self.user,
                content=content,
                reply_to=reply_to
            )
            return message
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            return None

    @database_sync_to_async
    def serialize_message(self, message):
        """Convert message to dictionary for JSON serialization"""
        return {
            'id': str(message.id),
            'sender': {
                'id': message.sender.id,
                'username': message.sender.username,
                'first_name': message.sender.first_name,
                'last_name': message.sender.last_name,
            },
            'content': message.content,
            'message_type': message.message_type,
            'timestamp': message.timestamp.isoformat(),
            'is_edited': message.is_edited,
            'edited_at': message.edited_at.isoformat() if message.edited_at else None,
            'reply_to': {
                'id': str(message.reply_to.id),
                'sender': message.reply_to.sender.username,
                'content': message.reply_to.content[:100] + ('...' if len(message.reply_to.content) > 100 else '')
            } if message.reply_to else None
        }

    @database_sync_to_async
    def update_user_online_status(self, is_online):
        """Update user's online status"""
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            status, created = UserOnlineStatus.objects.get_or_create(user=self.user)
            status.is_online = is_online
            if is_online:
                status.current_room = room
            else:
                status.current_room = None
            status.save()
        except Exception as e:
            logger.error(f"Error updating online status: {str(e)}")

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        """Mark message as read by user"""
        try:
            message = Message.objects.get(id=message_id, room__id=self.room_id)
            MessageReadStatus.objects.get_or_create(
                message=message,
                user=self.user
            )
        except Exception as e:
            logger.error(f"Error marking message as read: {str(e)}")

    @database_sync_to_async
    def edit_message(self, message_id, new_content):
        """Edit a message if user owns it"""
        try:
            message = Message.objects.get(
                id=message_id, 
                room__id=self.room_id, 
                sender=self.user
            )
            message.content = new_content
            message.is_edited = True
            message.edited_at = datetime.now()
            message.save()
            return message
        except Message.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error editing message: {str(e)}")
            return None