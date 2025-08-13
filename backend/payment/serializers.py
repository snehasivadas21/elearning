from rest_framework import serializers
from .models import Order,CoursePurchase
from courses.serializers import AdminCourseSerializer

class CoursePurchaseSerializer(serializers.ModelSerializer):
    course = AdminCourseSerializer(read_only=True)
    class Meta:
        model = CoursePurchase
        fields = ['id', 'course', 'is_paid', 'purchased_at']
        read_only_fields = ['is_paid', 'purchased_at']

    def validate(self, data):
        user = self.context['request'].user
        course = data['course']

        if CoursePurchase.objects.filter(student=user, course=course).exists():
            raise serializers.ValidationError("Course already purchased or enrolled.")
        
        if not course.is_active:
            raise serializers.ValidationError("Course is inactive.")
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        course = validated_data['course']

        # Simulate payment for now
        is_paid = not course.is_free

        return CoursePurchase.objects.create(
            student=user,
            course=course,
            is_paid=is_paid
        )

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['student', 'status', 'created_at']