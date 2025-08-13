from rest_framework import serializers
from .models import LiveSession

class LiveSessionSerializer(serializers.ModelSerializer):
    course_title = serializers.ReadOnlyField(source='course.title')
    instructor_name = serializers.ReadOnlyField(source='instructor.username')

    class Meta:
        model = LiveSession
        fields = [
            'id', 'title', 'course', 'course_title',
            'instructor', 'instructor_name',
            'scheduled_datetime', 'duration_minutes',
            'meeting_link', 'is_recurring', 'created_at'
        ]
        read_only_fields = ['instructor', 'created_at']