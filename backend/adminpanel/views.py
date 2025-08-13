from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets,permissions,filters
from users.models import CustomUser
from .serializers import UserSerializer

class StudentViewset(viewsets.ModelViewSet):
    queryset = CustomUser.objects.filter(role='student')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]  
    filter_backends = [filters.SearchFilter,filters.OrderingFilter]
    search_fields = ['username','email']
    ordering_fields = ['id','username','date_joined'] 

class InstructorViewset(viewsets.ModelViewSet):
    queryset = CustomUser.objects.filter(role='instructor')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]  
    filter_backends = [filters.SearchFilter,filters.OrderingFilter]
    search_fields = ['username','email']
    ordering_fields = ['id','username','date_joined'] 
