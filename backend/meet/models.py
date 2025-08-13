from django.db import models
from django.conf import settings
from courses.models import Course

class MockInterview(models.Model):
    STATUS_CHOICES = [
        ("scheduled","Scheduled"),
        ("completed","Completed"),
        ("missed","Missed"),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE , limit_choices_to={"role":"student"},related_name='interviews_as_student')
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True,limit_choices_to={'role':'instructor'},related_name='interview_as_instructor')
    course = models.ForeignKey(Course,on_delete=models.CASCADE)
    scheduled_at = models.DateTimeField()
    meet_link = models.URLField(blank=True,null=True)
    status = models.CharField(max_length=20,choices=STATUS_CHOICES,default='scheduled')
    feedback = models.TextField(blank=True,null=True)
    score = models.DecimalField(max_digits=5,decimal_places=2,null=True,blank=True)
    rating = models.PositiveIntegerField(null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scheduled_at']

    def __str__(self):
        return f"{self.student.email} - {self.course.title} - {self.status}"    
