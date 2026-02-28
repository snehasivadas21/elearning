from django.db import models
from courses.models import Course
from django.conf import settings

# Create your models here.
class Quiz(models.Model):
    course = models.OneToOneField("courses.Course", on_delete=models.CASCADE, related_name='final_quiz')
    title = models.CharField(max_length=255)
    is_final = models.BooleanField(default=False)
    pass_percentage = models.IntegerField(default=60)
    time_limit = models.IntegerField(null=True,blank=True)
    max_attempts = models.IntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.course.title}"

class Question(models.Model):
    quiz = models.ForeignKey(Quiz,on_delete=models.CASCADE,related_name="questions")
    text = models.TextField()
    marks = models.IntegerField(default=1)

    def __str__(self):
        return self.text[:50]

class Option(models.Model):
    question = models.ForeignKey(Question,on_delete=models.CASCADE,related_name="options")
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text

class UserQuizAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    score = models.FloatField()
    percentage = models.FloatField()
    is_passed = models.BooleanField(default=False)
    attempt_number = models.IntegerField()
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True,blank=True)

    class Meta:
        unique_together = ("user","quiz","attempt_number")

    def __str__(self):
        return f"{self.user} - {self.quiz.title} - Attempt {self.attempt_number}"    

class UserAnswer(models.Model):
    attempt = models.ForeignKey(UserQuizAttempt,on_delete=models.CASCADE,related_name="answers")
    question = models.ForeignKey(Question,on_delete=models.CASCADE)
    selected_option = models.ForeignKey(Option,on_delete=models.CASCADE)
    is_correct = models.BooleanField()

