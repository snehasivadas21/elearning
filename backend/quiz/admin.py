from django.contrib import admin
from .models import QuizSubmission,AnswerSubmission

# Register your models here.
admin.site.register(QuizSubmission)
admin.site.register(AnswerSubmission)