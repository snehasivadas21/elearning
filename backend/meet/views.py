from rest_framework import viewsets,permissions
from django.utils.timezone import now
from datetime import timedelta
from .models import MockInterview
from .serializers import MockInterviewSerializer
from users.permissions import IsInstructorUser,IsStudentUser
from .tasks import send_mock_interview_reminder
from courses.utils import issue_certificate_if_eligible

class InstructorMockInterviewViewSet(viewsets.ModelViewSet):
    serializer_class = MockInterviewSerializer
    permission_classes = [permissions.IsAuthenticated,IsInstructorUser]

    def get_queryset(self):
        return MockInterview.objects.filter(instructor = self.request.user)
    
    def perform_create(self,serializer):
        interview = serializer.save(instructor= self.request.user)

        reminder_time = interview.scheduled_at - timedelta(hours=1)
        if reminder_time > now():
           send_mock_interview_reminder.apply_async(
               args = [
                   interview.student.email,
                   interview.course.title,
                   str(interview.scheuled_at),
                   interview.meet_link
               ],
               eta = reminder_time
           )

    def perform_update(self,serializer):
        interview = serializer.save()
        if interview.status == "completed":
            issue_certificate_if_eligible(
                student=interview.student,
                course=interview.course
            )    

class StudentMockInterviewViewSet(viewsets.ModelViewSet):
    serializer_class = MockInterviewSerializer
    permission_classes =[permissions.IsAuthenticated,IsStudentUser]

    def get_queryset(self):
        return MockInterview.objects.filter(student = self.request.user)
    