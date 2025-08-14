# livesession/views.py
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import LiveSession, LiveParticipant
from .serializers import LiveSessionSerializer, LiveParticipantSerializer
from .permissions import IsInstructorOfCourse, IsEnrolledOrInstructor
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from courses.models import Course

# Create session (instructor)
class LiveSessionCreateView(generics.CreateAPIView):
    serializer_class = LiveSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        course_id = self.request.data.get("course")
        course = get_object_or_404(Course, id=course_id)
        if course.instructor_id != self.request.user.id:
            raise PermissionError("Only the instructor can create live sessions.")
        session = serializer.save(created_by=self.request.user)

        # Schedule reminder if scheduled_at present
        if session.scheduled_at:
            from .tasks import schedule_session_reminder
            schedule_session_reminder.apply_async(
                args=[str(session.id)],
                eta=session.scheduled_at - timezone.timedelta(minutes=10)
            )

# Detail (enrolled or instructor)
class LiveSessionDetailView(generics.RetrieveAPIView):
    queryset = LiveSession.objects.all()
    serializer_class = LiveSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsEnrolledOrInstructor]
    lookup_field = "id"

# Start session (instructor) -> broadcast "session_started" with join link
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def start_session(request, id):
    session = get_object_or_404(LiveSession, id=id)
    if session.course.instructor_id != request.user.id:
        return Response({"detail":"Forbidden"}, status=403)
    session.status = "ongoing"
    session.started_at = timezone.now()
    session.save(update_fields=["status","started_at"])

    # WS notification to course group
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"course_notify_{session.course_id}",
        {"type":"notify.message","payload":{
            "event":"session_started",
            "session_id": str(session.id),
            "course_id": session.course_id,
            "title": session.title,
            "join_url": f"/student/live/{session.id}"  # frontend route
        }}
    )
    return Response({"message":"Session started"})

# End session (instructor) -> broadcast "session_ended"
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def end_session(request, id):
    session = get_object_or_404(LiveSession, id=id)
    if session.course.instructor_id != request.user.id:
        return Response({"detail":"Forbidden"}, status=403)
    session.status = "ended"
    session.ended_at = timezone.now()
    session.save(update_fields=["status","ended_at"])

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"course_notify_{session.course_id}",
        {"type":"notify.message","payload":{
            "event":"session_ended",
            "session_id": str(session.id),
            "course_id": session.course_id,
            "title": session.title
        }}
    )
    return Response({"message":"Session ended"})

# (Optional) list participants of session
class LiveSessionParticipantsView(generics.ListAPIView):
    serializer_class = LiveParticipantSerializer
    permission_classes = [permissions.IsAuthenticated, IsEnrolledOrInstructor]

    def get_queryset(self):
        session = get_object_or_404(LiveSession, id=self.kwargs["id"])
        self.check_object_permissions(self.request, session)
        return LiveParticipant.objects.filter(session=session)
