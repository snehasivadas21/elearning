from rest_framework import serializers
from .models import LiveSession, LiveParticipant

class LiveSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveSession
        fields = "__all__"
        read_only_fields = ("id","status","started_at","ended_at","created_by","created_at")

class LiveParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveParticipant
        fields = "__all__"
