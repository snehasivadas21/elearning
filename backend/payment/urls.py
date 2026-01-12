from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet,CoursePurchaseViewSet,CreateRazorpayOrder,VerifyRazorpayPayment

router = DefaultRouter()
router.register(r'purchase', CoursePurchaseViewSet, basename='course-purchase')
router.register(r'orders', OrderViewSet,basename='course-order')

urlpatterns = [

    path('create-order/',CreateRazorpayOrder.as_view(),name='create-order'),
    path('verify-payment/',VerifyRazorpayPayment.as_view(), name='verify-payment'),

    path('', include(router.urls)),

]