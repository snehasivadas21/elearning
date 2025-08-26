from rest_framework import serializers
from .models import RecruiterProfile,JobPosting,Application

class RecruiterProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecruiterProfile
        fields = "__all__"
        read_only_fields = ["user","created_at","updated_at"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data) 

class JobPostingSerializer(serializers.ModelSerializer):
    recruiter = serializers.ReadOnlyField(source = "recruiter.id")
    recruiter_company = serializers.ReadOnlyField(source = "recruiter.company_name")

    class Meta:
        model = JobPosting
        fields ="__all__" 
        read_only_fields = ["recruiter","created_at","updated_at"]

    def create(self,validated_data):
        validated_data["recruiter"] = self.context["request"].user.recruiterprofile
        return super().create(validated_data)   

class ApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source = "student.username")
    job_title = serializers.ReadOnlyField(source = "job.title") 

    class Meta:
        model = Application
        fields = "__all__"
        read_only_fields =["student","status","applied_at","updated_at"] 

    def create(self, validated_data):
        validated_data["student"] = self.context["request"].user
        return super().create(validated_data)        