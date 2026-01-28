from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from courses.models import Course

class CourseNotifyConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.course_id = self.scope["url_route"]["kwargs"]["course_id"]
        self.group = f"course_notify_{self.course_id}"

        if not self.user or not self.user.is_authenticated:
            return await self.close()
        if not await self.can_subscribe(self.course_id, self.user.id):
            return await self.close()

        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group, self.channel_name)

    async def notify_message(self, event):
        await self.send_json(event["payload"])

    @database_sync_to_async
    def can_subscribe(self, course_id, uid):
        c = Course.objects.get(id=course_id)
        return (c.instructor_id == uid) or c.enrolled_students.filter(id=uid).exists()
