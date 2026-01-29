from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from courses.models import Course

class CourseNotifyConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.course_id = self.scope["url_route"]["kwargs"]["course_id"]
        self.group = f"course_notify_{self.course_id}"

        if not self.user.is_authenticated:
            return await self.close()

        if not await self.can_subscribe():
            return await self.close()

        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group, self.channel_name)

    async def notify_message(self, event):
        await self.send_json(event["payload"])

    @database_sync_to_async
    def can_subscribe(self):
        try:
            c = Course.objects.get(id=self.course_id)
        except Course.DoesNotExist:
            return False
        return c.instructor_id == self.user.id or c.enrolled_students.filter(id=self.user.id).exists()
