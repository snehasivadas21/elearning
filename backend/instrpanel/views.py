from rest_framework import viewsets,permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import Notification
from .serializers import TutorOrderSerializer,NotificationSerializer
from users.permissions import IsInstructorUser
from payment.models import Order

class TutorOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TutorOrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorUser]
    filter_backends = [DjangoFilterBackend,SearchFilter]
    search_fields = ["course__title","student__email"]

    def get_queryset(self):
        return Order.objects.filter(
            course__instructor=self.request.user,
            status="completed"
        ).select_related("course", "student").order_by("-created_at")

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")
