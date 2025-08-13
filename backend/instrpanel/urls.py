from django.urls import path
from .views import InstructorDashboardView

urlspatterns = [
    path('instructor/dashboard/',InstructorDashboardView.as_view(),name='instructor-dashboard')
]