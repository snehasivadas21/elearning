from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import LiveSession, LiveParticipant
from .serializers import LiveSessionSerializer, LiveParticipantSerializer
from .permissions import IsEnrolledOrInstructor
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from courses.models import Course
from .utils import notify_course_students


class LiveSessionCreateView(generics.CreateAPIView):
    serializer_class = LiveSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        course = get_object_or_404(Course, id=self.request.data.get("course"))

        if course.instructor_id != self.request.user.id:
            raise PermissionDenied("Only instructor can create live sessions")

        session = serializer.save(created_by=self.request.user)

        notify_course_students(
            course=course,
            title="New live session scheduled",
            message=f"{session.title} scheduled on {session.scheduled_at.strftime('%d %b %Y, %I:%M %p')}",
        )

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def start_session(request, id):
    session = get_object_or_404(LiveSession, id=id)

    if session.course.instructor_id != request.user.id:
        return Response({"detail": "Forbidden"}, status=403)

    if session.status != "scheduled":
        return Response({"detail": "Session cannot be started"}, status=400)

    session.status = "ongoing"
    session.started_at = timezone.now()
    session.save(update_fields=["status", "started_at"])
    
    notify_course_students(
        course=session.course,
        title="Live session started",
        message=f"{session.title} is live now. Join immediately!",
    )

    LiveParticipant.objects.get_or_create(
        session=session,
        user=request.user,
        defaults={"role": "instructor", "joined_at": timezone.now()}
    )

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"course_notify_{session.course_id}",
        {
            "type": "notify.message",
            "payload": {
                "event": "session_started",
                "session_id": str(session.id),
                "course_id": session.course_id,
                "title": session.title,
            }
        }
    )

    return Response({"message": "Session started"})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def end_session(request, id):
    session = get_object_or_404(LiveSession, id=id)

    if session.course.instructor_id != request.user.id:
        return Response({"detail": "Forbidden"}, status=403)

    if session.status != "ongoing":
        return Response({"detail": "Session is not live"}, status=400)

    session.status = "ended"
    session.ended_at = timezone.now()
    session.save(update_fields=["status", "ended_at"])

    LiveParticipant.objects.filter(
        session=session,
        left_at__isnull=True
    ).update(left_at=timezone.now())

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"course_notify_{session.course_id}",
        {
            "type": "notify.message",
            "payload": {
                "event": "session_ended",
                "session_id": str(session.id),
                "course_id": session.course_id,
            }
        }
    )

    async_to_sync(channel_layer.group_send)(
        f"webrtc_{session.id}",                                    # matches consumer's room_group
        {
            "type": "session.ended",                               # dots → underscores = session_ended method
            "session_id": str(session.id),
        }
    )

    return Response({"message": "Session ended"})

@api_view(["POST"])
def cancel_session(request, id):
    session = get_object_or_404(LiveSession, id=id)

    if session.course.instructor_id != request.user.id:
        return Response(status=403)

    if session.status != "scheduled":
        return Response({"detail": "Cannot cancel"}, status=400)

    session.status = "cancelled"
    session.save(update_fields=["status"])

    notify_course_students(
        course=session.course,
        title="Live session cancelled",
        message=f"{session.title} has been cancelled by instructor",
    )

    return Response({"message": "Session cancelled"})

class LiveSessionListView(generics.ListAPIView):
    serializer_class = LiveSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["status", "course"]
    search_fields = ["title"]

    def get_queryset(self):
        return LiveSession.objects.filter(
            created_by=self.request.user
        ).order_by("-created_at")

class LiveSessionDetailView(generics.RetrieveAPIView):
    queryset = LiveSession.objects.select_related("course")
    serializer_class = LiveSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

class LiveSessionUpdateView(generics.UpdateAPIView):
    serializer_class = LiveSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"
    queryset = LiveSession.objects.all()

    def perform_update(self, serializer):
        session = self.get_object()

        if session.course.instructor_id != self.request.user.id:
            raise PermissionDenied("Only instructor can edit")

        if session.status != "scheduled":
            raise PermissionDenied("Cannot edit once live started")

        serializer.save()

class LiveSessionParticipantsView(generics.ListAPIView):
    serializer_class = LiveParticipantSerializer
    permission_classes = [permissions.IsAuthenticated, IsEnrolledOrInstructor]

    def get_queryset(self):
        session = get_object_or_404(LiveSession, id=self.kwargs["id"])
        return LiveParticipant.objects.filter(session=session)
