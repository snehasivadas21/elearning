from rest_framework import serializers
from .models import CustomUser,Profile,ProfileLink
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed,PermissionDenied

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'password', 'confirm_password', 'role']

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
    
    def validate(self,value):
        if value['password'] != value['confirm_password']:
            raise serializers.ValidationError("password do not match")
        if len(value['password'])<8:
            raise serializers.ValidationError("password must be at least 8 characters")
        return value

    def create(self, validated_data):
        # validated_data['role'] = validated_data.get('role', 'student')
        # return CustomUser.objects.create_user(**validated_data)
    
        validated_data.pop('confirm_password')
        user = CustomUser.objects.create_user(**validated_data)
        user.is_verified=False
        user.save()
        return user
    
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self,data):
        try:
            user=CustomUser.objects.get(email=data['email'])
        except CustomUser.DoesNotExist:
            raise AuthenticationFailed("Invalid credentials")
        
        if not user.is_active:
            raise PermissionDenied("Your account has been suspened.")

        if not user.check_password(data['password']):
            raise AuthenticationFailed("Invalid password")
        
        data['user']=user
        return data
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'role', 'is_active', 'is_verified','is_staff','date_joined']
        read_only_fields = fields

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role  
        return token      
    
    def validate(self,attrs):
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            raise AuthenticationFailed("Invalid email or password")

        if not self.user.is_active:
            raise AuthenticationFailed("Your account has been suspended.Please contact support.")
        return data 

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uidb64']))
            self.user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid user")

        token_gen = PasswordResetTokenGenerator()
        if not token_gen.check_token(self.user, attrs['token']):
            raise serializers.ValidationError("Invalid or expired token")

        return attrs

    def save(self):
        self.user.set_password(self.validated_data['new_password'])
        self.user.save()
        return self.user   
    
class ProfileLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileLink
        fields = ["id", "label", "url"]

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    links = ProfileLinkSerializer(many=True, required=False)
    profile_image = serializers.ImageField(required=False, use_url=True)
    class Meta:
        model = Profile
        fields = ["id","user","full_name","bio","headline","profile_image","date_of_birth","location","experience","resume","skills","links",]

    def update(self, instance, validated_data):
        links_data = validated_data.pop("links", None)

        for attr,value in validated_data.items():
            setattr(instance,attr,value)

        instance.save()    

        if links_data is not None:
            instance.links.all().delete()
            for link in links_data:
                ProfileLink.objects.create(profile=instance, **link)

        return instance

                    
