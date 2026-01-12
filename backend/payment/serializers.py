from rest_framework import serializers
from .models import Order,CoursePurchase
from courses.serializers import AdminCourseSerializer


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['student', 'status', 'created_at','payment_id',]