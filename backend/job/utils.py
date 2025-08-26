from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification

def push_notification(user, title, message, kind="general"):
    notif = Notification.objects.create(user=user, title=title, message=message, kind=kind)
    payload = {
        "payload": {
            "id": notif.id,
            "title": notif.title,
            "message": notif.message,
            "kind": notif.kind,
            "is_read": notif.is_read,
            "created_at": notif.created_at.isoformat(),
        }
    }
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(f"user_{user.id}", {"type": "notify", **payload})
