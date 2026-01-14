from rest_framework import serializers
from users.models import CustomUser
from payment.models import Order

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'role', 'is_active', 'is_verified','is_staff','date_joined','password']
        extra_kwargs = {
            'password':{'write_only':True,'required':False}
        }

    def create(self,validated_data):
        password = validated_data.pop('password',None)
        user = CustomUser(**validated_data)    
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self,instance,validate_data):
        password = validate_data.pop('password',None)
        for attr,value in validate_data.items():
            setattr(instance,attr,value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance  
class AdminOrderSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="student.email", read_only=True)
    user_username = serializers.CharField(source="student.username", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_id",
            "user_email",
            "user_username",
            "course_title",
            "amount",
            "status",
            "payment_id",
            "created_at",
        ]
          