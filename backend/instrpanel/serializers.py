from rest_framework import serializers
from payment.models import Order

class TutorOrderSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    student_email = serializers.EmailField(source="student.email", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "course_title",
            "student_email",
            "amount",
            "status",
            "created_at",
        ]
