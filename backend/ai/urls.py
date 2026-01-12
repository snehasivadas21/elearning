from django.urls import path
from ai.views import CourseChatAPIView

urlpatterns = [
    path("chat/", CourseChatAPIView.as_view(), name="course-chat"),
]
