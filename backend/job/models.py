from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField

class RecruiterProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,limit_choices_to={'role':'recruiter'})
    company_name = models.CharField(max_length=100)
    logo = CloudinaryField("company_logo",blank=True,null=True)
    website = models.URLField(blank=True,null=True)
    industry = models.CharField(max_length=150,blank=True)
    description = models.TextField(blank=True)
    contact_email = models.EmailField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.company_name
    
class JobPosting(models.Model):
    recruiter = models.ForeignKey(RecruiterProfile,on_delete=models.CASCADE,related_name="jobs")
    title = models.CharField(max_length=255)
    description = models.TextField()
    required_skills = models.JSONField(default=list)
    experience_level = models.CharField(
        max_length=50,
        choices=[("intern","Internship"),("junior","Junior"),("mid","Mid-level"),("senior","Senior")]       
    )
    employment_type = models.CharField(
        max_length=50,
        choices=[("full_time","Full-time"),("part-time","Part-time"),("contract","Contract")]
    )
    salary_range = models.CharField(max_length=100,blank=True)
    location = models.CharField(max_length=200,blank=True)
    status = models.CharField(
        max_length=20,
        choices=[("active","Active"),("closed","Closed")],
        default="active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} at {self.recruiter.company_name}"
    
class Application(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role':'student'}
    )    
    job = models.ForeignKey(JobPosting,on_delete=models.CASCADE,related_name="application")
    resume = CloudinaryField("resume")
    cover_letter = models.TextField(blank=True,null=True)
    status = models.CharField(
        max_length=20,
        choices=[("applied","Applied"),("shortlisted","Shortlisted"),("rejected","Rejected"),("hired","Hired")],
        default="applied"
    )
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student","job")
    def __str__(self):
        return f"{self.student.username} -> {self.job.title}"     
    
class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="notifications")
    title = models.CharField(max_length=120,blank=True)
    message = models.TextField()
    kind =models.CharField(max_length=50,default="general")
    is_read=models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]