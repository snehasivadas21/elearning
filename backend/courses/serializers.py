from rest_framework import serializers
from .models import (Course,CourseCategory,Module, Lesson,LessonProgress,
CourseCertificate,LessonResource,CourseReview)
from payment.models import CoursePurchase
from quiz.serializers import QuizSerializer

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
        validated_data['status']='submitted'
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('instructor', None)
        validated_data.pop('status', None)
        return super().update(instance, validated_data)    

class AdminCourseSerializer(serializers.ModelSerializer):
    instructor_username = serializers.CharField(source='instructor.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)    
    course_image = serializers.ImageField(required=False, use_url=True)
    category = serializers.PrimaryKeyRelatedField(queryset=CourseCategory.objects.all())

    class Meta:
        model=Course
        fields='__all__'      

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

class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    quiz = QuizSerializer(many=True,read_only=True)

    class Meta:
        model = Module
        fields = '__all__'   

class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress 
        fields = ['id','student','lesson','completed','completed_at'] 
        read_only_fields = ['id','student','completed_at']           

class CertificateSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = CourseCertificate
        fields = ['id', 'course', 'course_title', 'issued_at', 'certificate_file']

class CourseReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseReview
        fields = ['id','course','rating','review','created_at']
        read_only_fields = ['created_at']

    def validate(self,data):
        user = self.context['request'].user
        course = data['course']

        if not CoursePurchase.objects.filter(student = user,course=course,is_paid=True).exists():
            raise serializers.ValidationError("You must purchase this course to leave a review")
        return data
    
    def create(self,validated_data):
        return CourseReview.objects.create(student = self.context['request'].user,**validated_data)
    
    
    

 