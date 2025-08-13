from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from django.db.models import Q, Count, Max
from django.shortcuts import get_object_or_404
from courses.models import Course
from .models import ChatRoom, Message, MessageReadStatus, UserOnlineStatus
from .serializers import ChatRoomSerializer, MessageSerializer, UserSerializer

class MessagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class ChatRoomListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Get all rooms user has access to
        course_rooms = ChatRoom.objects.filter(
            room_type='course',
            course__enrolled_students=user,
            is_active=True
        )
        
        instructor_rooms = ChatRoom.objects.filter(
            room_type='course',
            course__instructor=user,
            is_active=True
        )
        
        direct_rooms = ChatRoom.objects.filter(
            room_type='direct',
            participants=user,
            is_active=True
        )
        
        return (course_rooms | instructor_rooms | direct_rooms).distinct().annotate(
            last_message_time=Max('messages__timestamp')
        ).order_by('-last_message_time')
    
    def perform_create(self, serializer):
        # Only allow creating direct message rooms via this endpoint
        serializer.save(
            created_by=self.request.user,
            room_type='direct'
        )

class ChatRoomDetailView(generics.RetrieveAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(
            Q(participants=user) | 
            Q(course__enrolled_students=user) |
            Q(course__instructor=user),
            is_active=True
        ).distinct()

class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MessagePagination
    
    def get_queryset(self):
        room_id = self.kwargs['room_id']
        room = get_object_or_404(ChatRoom, id=room_id)
        
        # Check user has access to this room
        user = self.request.user
        has_access = False
        
        if room.room_type == 'course':
            has_access = (room.course.enrolled_students.filter(id=user.id).exists() or 
                         room.course.instructor == user)
        elif room.room_type == 'direct':
            has_access = room.participants.filter(id=user.id).exists()
        
        if not has_access:
            return Message.objects.none()
        
        return room.messages.select_related('sender', 'reply_to').order_by('-timestamp')

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_direct_chat(request):
    """Create or get existing direct chat between two users"""
    other_user_id = request.data.get('user_id')
    
    if not other_user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        other_user = User.objects.get(id=other_user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if other_user == request.user:
        return Response({'error': 'Cannot create chat with yourself'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if direct chat already exists
    existing_room = ChatRoom.objects.filter(
        room_type='direct',
        participants=request.user
    ).filter(participants=other_user).first()
    
    if existing_room:
        serializer = ChatRoomSerializer(existing_room, context={'request': request})
        return Response(serializer.data)
    
    # Create new direct chat room
    room = ChatRoom.objects.create(
        name=f"Chat between {request.user.username} and {other_user.username}",
        room_type='direct',
        created_by=request.user
    )
    room.participants.add(request.user, other_user)
    
    serializer = ChatRoomSerializer(room, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_course_chat(request, course_id):
    """Add user to course chat room when they enroll"""
    try:
        course = Course.objects.get(id=course_id)
        room = ChatRoom.objects.get(course=course, room_type='course')
        
        # Check if user is enrolled in the course
        if not course.enrolled_students.filter(id=request.user.id).exists():
            return Response({'error': 'You are not enrolled in this course'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        serializer = ChatRoomSerializer(room, context={'request': request})
        return Response(serializer.data)
        
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Chat room not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_online_users(request, room_id):
    """Get list of online users in a chat room"""
    try:
        room = get_object_or_404(ChatRoom, id=room_id)
        
        # Check user has access to this room
        user = request.user
        has_access = False
        
        if room.room_type == 'course':
            has_access = (room.course.enrolled_students.filter(id=user.id).exists() or 
                         room.course.instructor == user)
        elif room.room_type == 'direct':
            has_access = room.participants.filter(id=user.id).exists()
        
        if not has_access:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get online users in this room
        online_users = User.objects.filter(
            online_status__is_online=True,
            online_status__current_room=room
        ).distinct()
        
        serializer = UserSerializer(online_users, many=True)
        return Response(serializer.data)
        
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Chat room not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_messages_as_read(request, room_id):
    """Mark all messages in a room as read for current user"""
    try:
        room = get_object_or_404(ChatRoom, id=room_id)
        
        # Get unread messages for this user in this room
        unread_messages = room.messages.exclude(
            read_statuses__user=request.user
        )
        
        # Mark all as read
        for message in unread_messages:
            MessageReadStatus.objects.get_or_create(
                message=message,
                user=request.user
            )
        
        return Response({'message': f'Marked {unread_messages.count()} messages as read'})
        
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Chat room not found'}, status=status.HTTP_404_NOT_FOUND)