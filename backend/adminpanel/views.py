from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets,permissions,filters
from users.models import CustomUser
from .serializers import UserSerializer
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from payment.models import Order
from .serializers import AdminOrderSerializer
from users.permissions import IsAdminUser

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

class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Order.objects.select_related("student", "course").order_by("-created_at")
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAdminUser]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = ["status", "course"]
    search_fields = ["student__email", "student__username"]
    ordering_fields = ["created_at", "amount"]
