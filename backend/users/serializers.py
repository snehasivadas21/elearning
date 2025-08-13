from rest_framework import serializers
from .models import CustomUser,StudentProfile
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'password', 'role']

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_role(self, value):
        if value not in ['student', 'instructor', 'recruiter']:
            raise serializers.ValidationError("Invalid role selected.")
        return value

    def create(self, validated_data):
        validated_data['role'] = validated_data.get('role', 'student')
        return CustomUser.objects.create_user(**validated_data)
    
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self,data):
        email=data.get('email')
        password=data.get('password')
        user=authenticate(email=email,password=password)

        if not user:
            raise serializers.ValidationError("Invalid credentials")
        if not user.is_verified:
            raise serializers.ValidationError("Email not verified")
        
        data['user']=user
        return data
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'role', 'is_active', 'is_verified','is_staff','date_joined']

class StudentProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False, use_url=True)
    class Meta:
        model = StudentProfile
        fields = ['bio','dob','phone','profile_picture']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role  
        return token        