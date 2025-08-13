import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ChatMessage, LiveSession
from channels.db import database_sync_to_async

class LiveSessionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.group_name = f'live_session_{self.session_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        user = self.scope['user']

        # Save message to DB
        await self.save_message(user, self.session_id, message)

        # Broadcast to group
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'session_message',
                'message': message,
                'user': user.username,
            }
        )

    async def session_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'user': event['user'],
        }))

    @database_sync_to_async
    def save_message(self, user, session_id, message):
        session = LiveSession.objects.get(unique_room_id=session_id)
        ChatMessage.objects.create(session=session, user=user, content=message)