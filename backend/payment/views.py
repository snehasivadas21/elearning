from rest_framework import viewsets, permissions, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import Order,CoursePurchase,Invoice
from .serializers import OrderSerializer,CoursePurchaseSerializer
from users.permissions import IsStudentUser
from courses.models import Course
import razorpay
import hmac
import hashlib
from rest_framework.decorators import api_view
from .utils import generate_invoice_number,create_invoice_pdf


razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class CoursePurchaseViewSet(viewsets.ModelViewSet):
    serializer_class =  CoursePurchaseSerializer
    permission_classes =[permissions.IsAuthenticated,IsStudentUser]

    def get_queryset(self):
        return CoursePurchase.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        if CoursePurchase.objects.filter(student=self.request.user,course=course).exists():
            raise serializers.ValidationErro("You are already enrolled in this course.")
        serializer.save(student=self.request.user)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(student=self.request.user, status='pending')

class CreateRazorpayOrder(APIView):
    permission_classes = [permissions.IsAuthenticated,IsStudentUser]

    def post(self,request):
        course_id = request.data.get("course_id")
        course = Course.objects.get(id=course_id,is_published=True)

        if CoursePurchase.objects.filter(
            student = request.user,
            course=course
        ).exists():
            return Response({"error":"Course already purchased."},status=400)       

        amount_paise = int(course.price * 100)

        razorpay_order = razorpay_client.order.create({
            "amount":amount_paise,
            "currency":"INR",
            "payment_capture":1
        })

        Order.objects.create(
            student = request.user,
            course = course,
            order_id = razorpay_order['id'],
            amount = course.price,
            status = "pending"
        )

        return Response({
            "razorpay_order_id" : razorpay_order['id'],
            "amount" : amount_paise,
            "currency" : "INR",
            "course_id" : course.id,
            "key" : settings.RAZORPAY_KEY_ID
        })
    

class VerifyRazorpayPayment(APIView):
    permission_classes = [permissions.IsAuthenticated,IsStudentUser]

    def post(self, request):
        data = request.data
        order_id = data.get('razorpay_order_id')
        payment_id = data.get('razorpay_payment_id')
        signature = data.get('razorpay_signature')

        generated_signature = hmac.new(
            bytes(settings.RAZORPAY_KEY_SECRET, 'utf-8'),
            bytes(f"{order_id}|{payment_id}", 'utf-8'),
            hashlib.sha256
        ).hexdigest()

        if generated_signature != signature:
            return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.select_for_update().get(order_id=order_id, student=request.user)

        if order.status == 'completed':
            return Response({"message":"Already processed"})

        purchase = CoursePurchase.objects.create(
            student=request.user,
            course=order.course
        )

        order.payment_id = payment_id
        order.status = 'completed'
        order.save()

        invoice = Invoice.objects.create(
            student = request.user,
            purchase =  purchase,
            invoice_number = generate_invoice_number(),
        ) 
        pdf = create_invoice_pdf(invoice)
        invoice.pdf_file.save(f"{invoice.invoice_number}.pdf",pdf)

        return Response({"message":"Payment success & invoice generated",
                         "course_id":order.course.id})   
