from rest_framework import serializers
from .models import (Course,CourseCategory,Module, Lesson,LessonResource)

class CourseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCategory
        fields = '__all__'

class InstructorCourseSerializer(serializers.ModelSerializer):
    course_image = serializers.ImageField(required=False, use_url=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=CourseCategory.objects.all())

    class Meta:
        model = Course
        exclude = ['rating','is_published','created_at','instructor'] 

    def get_category_name(self, obj):
        return {
            "id": obj.category.id,
            "name": obj.category.name
        }    

    def create(self,validated_data):
        validated_data['instructor']=self.context['request'].user
        if 'status' not in validated_data:
            validated_data['status']='submitted'
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('instructor', None)
        validated_data.pop('status', None)
        return super().update(instance, validated_data)         

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
        fields = '__all__'

    def create(self, validated_data):
        validated_data["status"] = "draft"
        return super().create(validated_data)    

class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = '__all__'   

    def create(self, validated_data):
        validated_data["status"] = "draft"
        return super().create(validated_data)    
    
class AdminCourseSerializer(serializers.ModelSerializer):
    instructor_username = serializers.CharField(source='instructor.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)    
    course_image = serializers.ImageField(required=False, use_url=True)
    category = serializers.PrimaryKeyRelatedField(queryset=CourseCategory.objects.all())

    modules = ModuleSerializer(many=True,read_only=True)

    class Meta:
        model=Course
        fields='__all__'     

