from django.urls import path
from . import views

urlpatterns = [
    path('rooms/', views.ChatRoomListCreateView.as_view(), name='chat-room-list'),
    path('rooms/<uuid:id>/', views.ChatRoomDetailView.as_view(), name='chat-room-detail'),
    path('rooms/<uuid:room_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('create-direct-chat/', views.create_direct_chat, name='create-direct-chat'),
    path('join-course-chat/<int:course_id>/', views.join_course_chat, name='join-course-chat'),
    path('rooms/<uuid:room_id>/online-users/', views.get_online_users, name='online-users'),
    path('rooms/<uuid:room_id>/mark-read/', views.mark_messages_as_read, name='mark-messages-read'),
]