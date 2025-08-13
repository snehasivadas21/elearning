from django.db import models
from courses.models import Module
from django.conf import settings


class Quiz(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=255)
    instructions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Quiz for {self.lesson.title}"


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.text


class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.text} ({'Correct' if self.is_correct else 'Wrong'})"

class QuizSubmission(models.Model):
    student=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,limit_choices_to={'role':'student'})
    quiz = models.ForeignKey(Quiz,on_delete=models.CASCADE)
    submitted_at=models.DateTimeField(auto_now_add=True)
    score=models.DecimalField(max_digits=5,decimal_places=2,default=0.0)
    passed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.student.username} - {self.quiz.title} ({'Passed' if self.passed else 'Failed'})"
    
class AnswerSubmission(models.Model):
    submission = models.ForeignKey(QuizSubmission,on_delete=models.CASCADE,related_name='answers')
    question = models.ForeignKey(Question,on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice,on_delete=models.SET_NULL,null=True,blank=True) 

    def __str__(self):
        return f"Answer for {self.question.text}"