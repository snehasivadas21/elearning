import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.shortcuts import get_object_or_404
from .models import LiveSession
from courses.models import Course

class LiveSessionConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.room_group = f"webrtc_{self.session_id}"

        if not self.user or not self.user.is_authenticated:
            return await self.close()

        if not await self.can_join(self.session_id, self.user.id):
            return await self.close()

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive_json(self, content, **kwargs):
        t = content.get("type")
        if t in ("offer","answer","ice-candidate"):
            await self.channel_layer.group_send(self.room_group, {
                "type":"signal.forward",
                "from": self.user.id,
                "to": content.get("to"),
                "signal_type": t,
                "payload": {k:v for k,v in content.items() if k != "type"}
            })

    async def signal_forward(self, event):
        await self.send_json({
            "type":"signal",
            "from": event["from"],
            "to": event["to"],
            "signal_type": event["signal_type"],
            **event["payload"]
        })

    @database_sync_to_async
    def can_join(self, sid, uid):
        s = get_object_or_404(LiveSession, id=sid)
        c = s.course
        return (c.instructor_id == uid) or c.enrolled_students.filter(id=uid).exists()
