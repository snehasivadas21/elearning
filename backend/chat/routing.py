from django.urls import re_path
from .consumers import ChatConsumer,UserNotificationConsumer

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<room_id>[0-9a-f-]+)/$", ChatConsumer.as_asgi()),
    re_path(r"ws/chat/user/(?P<user_id>\d+)/$", UserNotificationConsumer.as_asgi()),
]
