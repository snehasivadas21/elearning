# livesession/routing.py
from django.urls import re_path
from .consumers import LiveSessionConsumer
from .notify_consumer import CourseNotifyConsumer

websocket_urlpatterns = [
    re_path(r"ws/live/(?P<session_id>[0-9a-f-]+)/$", LiveSessionConsumer.as_asgi()),
    re_path(r"ws/notify/course/(?P<course_id>\d+)/$", CourseNotifyConsumer.as_asgi()),
]
