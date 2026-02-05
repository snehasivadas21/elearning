from rest_framework import serializers
from django.utils import timezone
from .models import LiveSession, LiveParticipant

class LiveSessionSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(
        source="course.title", read_only=True
    )
    class Meta:
        model = LiveSession
        fields = [
            "id",
            "course",
            "course_title",   
            "title",
            "description",
            "scheduled_at",
            "allow_early_join",
            "status",
            "started_at",
            "ended_at",
            "created_by",
            "created_at",
        ]
        read_only_fields = (
            "id", "status", "started_at", "ended_at",
            "created_by", "created_at", "notification_sent"
        )
        
    def validate_course(self, course):
        if course.status != "approved":
            raise serializers.ValidationError(
                "Live sessions can only be created for approved courses."
            )
        return course

    def validate_scheduled_at(self, value):
        if value and value < timezone.now():
            raise serializers.ValidationError("Scheduled time cannot be in the past.")
        return value


class LiveParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveParticipant
        fields = "__all__"
