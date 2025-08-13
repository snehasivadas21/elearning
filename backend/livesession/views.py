from rest_framework import viewsets, permissions
from .models import LiveSession
from .serializers import LiveSessionSerializer
import uuid

class LiveSessionViewSet(viewsets.ModelViewSet):
    queryset = LiveSession.objects.all()
    serializer_class = LiveSessionSerializer

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'DELETE']:
            return [permissions.IsAuthenticated(), permissions.IsAdminUser() | permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        room_id = uuid.uuid4().hex[:10]
        jitsi_link = f"https://meet.jit.si/pytech-{room_id}"
        serializer.save(instructor=self.request.user, meeting_link=jitsi_link, unique_room_id=room_id)

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course__id=course_id)
        return queryset
    