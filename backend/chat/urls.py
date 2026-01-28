from django.urls import path
from . import views

urlpatterns = [
    path('rooms/', views.MyCourseChatRoomsView.as_view(), name='chat-room-list'),
    path('rooms/<uuid:id>/', views.ChatRoomDetailView.as_view(), name='chat-room-detail'),
    path('rooms/<uuid:room_id>/messages/', views.MessageListView.as_view(), name='message-list')
]