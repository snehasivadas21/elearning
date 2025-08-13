from rest_framework import serializers
from users.models import CustomUser

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