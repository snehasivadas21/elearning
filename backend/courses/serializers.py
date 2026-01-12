from rest_framework import serializers
from .models import (Course,CourseCategory,Module, Lesson,LessonResource,LessonProgress,CourseCertificate)
from django.db import transaction
from users.serializers import ProfileSerializer

class CourseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCategory
        fields = ['id','name','description','is_active','created_at']
        read_only_fields = ['is_active']

    def validate_name(self,value):
        if CourseCategory.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("Category already exists.")
        return value    

class InstructorCourseSerializer(serializers.ModelSerializer):
    course_image = serializers.ImageField(required=False, use_url=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=CourseCategory.objects.filter(is_active=True))
    instructor_profile = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id','title','description','category','category_name','level','price','course_image','status','updated_at','instructor_profile',
        ]
        read_only_fields = ['status']

    def create(self,validated_data):
        with transaction.atomic():
            validated_data['instructor']=self.context['request'].user
            validated_data['status'] = 'draft'
            return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('instructor', None)
        validated_data.pop('status', None)

        if instance.status == 'approved':
            instance.is_published = False
            instance.status = 'submitted'
            instance.save(update_fields=['status','is_published'])
        return super().update(instance, validated_data) 

    def get_instructor_profile(self, obj):
        profile = getattr(obj.instructor, "profile", None)
        if not profile:
            return None
        return ProfileSerializer(profile).data
class LessonResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonResource  
        fields =['id','lesson','title','file','uploaded_at']

    def validate_file(self, file):
        if file.size > 10 * 1024 * 1024:  
            raise serializers.ValidationError("File size too large (max 10MB).")
        if not file.name.endswith(('.pdf', '.docx', '.pptx')):
            raise serializers.ValidationError("Unsupported file type.")
        return file
             

class LessonSerializer(serializers.ModelSerializer):
    resources = LessonResourceSerializer(many=True,read_only=True)
    class Meta:
        model = Lesson
        fields = ['id','module','title','content_type','content_url','video_file','order','is_preview','is_active','created_at','updated_at','resources']
        read_only_fields = ['created_at','updated_at']    

class ModuleSerializer(serializers.ModelSerializer):
    lessons = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            'id',
            'course',
            'title',
            'description',
            'order',
            'is_active',
            'created_at',
            'updated_at',
            'lessons',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_lessons(self, obj):
        lessons = obj.lessons.filter(is_deleted=False)
        return LessonSerializer(lessons, many=True).data
    
class AdminCourseSerializer(serializers.ModelSerializer):
    instructor_username = serializers.CharField(source='instructor.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)    
    course_image = serializers.ImageField(required=False, use_url=True)
    category = serializers.PrimaryKeyRelatedField(queryset=CourseCategory.objects.all())
    instructor_profile = serializers.SerializerMethodField()

    class Meta:
        model=Course
        fields=['id','title','price','level','status','is_active','is_published','admin_feedback','instructor_username','category_name','created_at','course_image','category','updated_at','instructor_profile',]  
        read_only_fields = fields

    def validate_category(self,value):
        if value and not value.is_active:
            raise serializers.ValidationError("Inactive category cannot be assigned.")
        return value
    
    def get_instructor_profile(self, obj):
        profile = getattr(obj.instructor, "profile", None)
        if not profile:
            return None
        return ProfileSerializer(profile).data

class UserCourseDetailSerializer(serializers.ModelSerializer):
    instructor_username = serializers.CharField(source="instructor.username", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    course_image = serializers.ImageField(required=False, use_url=True)
    modules = serializers.SerializerMethodField()
    instructor_profile = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "price",
            "level",
            "course_image",
            "updated_at",
            "instructor_username",
            "category_name",
            "modules",
            "instructor_profile",
        ]

    def get_modules(self, obj):
        return ModuleSerializer(
            obj.modules.filter(is_active=True,is_deleted=False),
            many=True,
            context=self.context
        ).data
    
    def get_instructor_profile(self, obj):
        profile = getattr(obj.instructor, "profile", None)
        if not profile:
            return None
        return ProfileSerializer(profile).data
class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress 
        fields = ['id','student','lesson','completed','completed_at'] 
        read_only_fields = fields

class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCertificate
        fields = [
            "certificate_id",
            "course",
            "certificate_file",
            "issued_at",
        ]
        read_only_fields = fields
