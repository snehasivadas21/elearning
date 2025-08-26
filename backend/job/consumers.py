# notifications/consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.core.paginator import Paginator
from .models import Notification

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close()
            return
        self.user = user
        self.group_name = f"user_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        # Send initial payload (unread + recent)
        unread, recent = await self._initial_payload()
        await self.send_json({"type": "init", "unread": unread, "recent": recent})

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")
        if action == "mark_read":
            notif_id = content.get("id")
            if notif_id:
                await self._mark_read(notif_id)
                await self.send_json({"type": "marked", "id": notif_id})
        elif action == "mark_all_read":
            await self._mark_all_read()
            await self.send_json({"type": "marked_all"})
        elif action == "fetch":
            page = int(content.get("page", 1))
            data = await self._fetch_page(page)
            await self.send_json({"type": "history", "page": page, "items": data})

    # Called by group_send
    async def notify(self, event):
        """
        event = {"type": "notify", "payload": {...}}
        """
        await self.send_json({"type": "notification", **event["payload"]})

    # DB helpers
    @database_sync_to_async
    def _initial_payload(self):
        unread_qs = Notification.objects.filter(user=self.user, is_read=False)[:20]
        recent_qs = Notification.objects.filter(user=self.user)[:20]
        unread = [self._to_dict(n) for n in unread_qs]
        recent = [self._to_dict(n) for n in recent_qs]
        return unread, recent

    @database_sync_to_async
    def _mark_read(self, notif_id):
        Notification.objects.filter(user=self.user, id=notif_id).update(is_read=True)

    @database_sync_to_async
    def _mark_all_read(self):
        Notification.objects.filter(user=self.user, is_read=False).update(is_read=True)

    @database_sync_to_async
    def _fetch_page(self, page):
        qs = Notification.objects.filter(user=self.user)
        p = Paginator(qs, 20)
        items = p.page(page).object_list if page <= p.num_pages else []
        return [self._to_dict(n) for n in items]

    def _to_dict(self, n: Notification):
        return {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "kind": n.kind,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
