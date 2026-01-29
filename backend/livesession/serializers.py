from rest_framework import serializers
from django.utils import timezone
from .models import LiveSession, LiveParticipant

class LiveSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveSession
        fields = "__all__"
        read_only_fields = (
            "id", "status", "started_at", "ended_at",
            "created_by", "created_at", "notification_sent"
        )

    def validate_scheduled_at(self, value):
        if value and value < timezone.now():
            raise serializers.ValidationError("Scheduled time cannot be in the past.")
        return value


class LiveParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveParticipant
        fields = "__all__"
