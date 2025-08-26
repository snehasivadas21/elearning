from django.shortcuts import render
from rest_framework import viewsets,permissions
from .models import RecruiterProfile,JobPosting,Application
from .serializers import RecruiterProfileSerializer,JobPostingSerializer,ApplicationSerializer
from .permissions import IsRecruiter,IsStudent,IsAdmin,IsOwnerOrReadOnly
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count


# Create your views here.
class RecruiterProfileViewSet(viewsets.ModelViewSet):
    serializer_class = RecruiterProfileSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return RecruiterProfile.objects.all()
        return RecruiterProfile.objects.filter(user=user)
    
    def get_permissions(self):
        if self.request.user.role == "admin":
            return [permissions.IsAuthenticated()]
        return [IsRecruiter]
    
class JobPostingViewSet(viewsets.ModelViewSet):
    serializer_class = JobPostingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role ==  "admin":
            return JobPosting.objects.all()
        elif user.role == "recruiter":
            return JobPosting.objects.filter(recruiter__user=user)
        return JobPosting.objects.filter(status="active")

    def get_permissions(self):
        if self.request.user.role == "admin":
            return [permissions.IsAuthenticated()]
        elif self.request.user.role == "recruiter":
            return [IsRecruiter(),IsOwnerOrReadOnly()]
        return [permissions.IsAuthenticated()]

class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Application.objects.all()
        elif user.role == "recruiter":
            return Application.objects.filter(job__recruiter__user=user)
        return Application.objects.filter(student=user)

    def get_permissions(self):
        if self.request.user.role == "admin":
            return [permissions.IsAuthenticated()]
        elif self.request.user.role == "recruiter":
            return [IsRecruiter(),IsOwnerOrReadOnly()]
        return [IsStudent(),IsOwnerOrReadOnly()]        
    
    @action(detail=True,methods=["post"],permission_classes=[IsRecruiter])
    def shortlist(self,request,pk=None):
        app = self.get_object()
        app.status = "shortlisted"
        app.save()
        return Response({"status":"shortlisted"},status=status.HTTP_200_OK)
    
    @action(detail=True,methods=["post"],permissions_classes=[IsRecruiter])
    def reject(self,request,pk=None):
        app=self.get_object()
        app.status = "rejected"
        app.save()
        return Response({"status":"rejected"},status=status.HTTP_200_OK)
    
    @action(detail=True,methods=["post"],permission_classes=[IsRecruiter])
    def hire(self,request,pk=None):
        app = self.get_object()
        app.status = "hired"
        app.save()
        return Response({"status":"hired"},status=status.HTTP_200_OK)

class RecruiterDashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return JobPosting.filter(recruiter = self.request.user)
    
    @action(detail=False,methods=['get'])
    def metrics(self,request):
        recruiter_jobs = self.get_queryset()
        applications = Application.objects.filter(job__in = recruiter_jobs)

        data = {
            "total_jobs":recruiter_jobs.count(),
            "total_applications":applications.count(),
            "shortlisted":applications.filter(status="shortlisted").count(),
            "hired":applications.filter(status="hired").count(),
        }
        return Response(data)
    
    @action(detail=False,methods=['get'])
    def recent_applications(self,request):
        recruiter_jobs = self.get_queryset()
        applications = (
            Application.objects.filter(job__in = recruiter_jobs).select_related("student","job").order_by("-created_at")[:10]
        )
        data = [
            {
                "id":app.id,
                "student":app.student.full_name,
                "job":app.job.title,
                "status":app.status,
                "applied_at":app.created_at,

            }
            for app in applications
        ]
        return Response(data)
    
    @action(detail=False,methods=['get'])
    def applications_per_jobs(self,request):
        recruiter_jobs = self.get_queryset()
        data = (
            Application.objects.filter(job__in=recruiter_jobs).values("job__title").annotate(count=Count("id"))

        )
        return Response(list(data))