from rest_framework import viewsets, permissions, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from django.conf import settings
from django.http import HttpResponse,FileResponse
from .models import Order,CoursePurchase,Invoice
from .serializers import OrderSerializer,CoursePurchaseSerializer,InvoiceSerializer
from users.permissions import IsStudentUser
from courses.models import Course
from django.db import transaction
import razorpay
import hmac
import hashlib
import requests
from rest_framework.decorators import api_view
from .utils import generate_invoice_number,create_invoice_pdf


razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class CoursePurchaseViewSet(viewsets.ModelViewSet):
    serializer_class =  CoursePurchaseSerializer
    permission_classes =[permissions.IsAuthenticated,IsStudentUser]

    def get_queryset(self):
        qs = CoursePurchase.objects.filter(student=self.request.user).select_related("course","course__category","course__instructor")

        course_id = self.request.query_params.get("course_id")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs    

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        if CoursePurchase.objects.filter(student=self.request.user,course=course).exists():
            raise serializers.ValidationError("You are already enrolled in this course.")
        serializer.save(student=self.request.user)

    @action(detail=False,methods=["get"])
    def enrolled(self,request):
        course_id = request.query_params.get("course_id")
        enrolled = CoursePurchase.objects.filter(
            student = request.user,
            course_id = course_id
        ).exists()
        return Response({"enrolled":enrolled})    

class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            student=self.request.user
        ).select_related("course").order_by("-created_at")

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
        with transaction.atomic():
            order = Order.objects.select_for_update().get(order_id=order_id, student=request.user)

            if order.status == 'completed':
                return Response({"message":"Already processed"})

            purchase = CoursePurchase.objects.create(
                student=request.user,
                course=order.course,
                order=order
            )
            
            order.purchase = purchase
            order.payment_id = payment_id
            order.status = 'completed'
            order.save()

            invoice = Invoice.objects.create(
                student = request.user,
                purchase =  purchase,
                invoice_number = generate_invoice_number(),
            ) 
            pdf_url = create_invoice_pdf(invoice)
            invoice.pdf_file = pdf_url
            invoice.save()

        return Response({
            "message":"Payment success & invoice generated",
            "course_id":order.course.id,
            "invoice_id":invoice.id,
            "invoice_number":invoice.invoice_number})   

class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class=InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated,IsStudentUser]

    def get_queryset(self):
        return Invoice.objects.filter(student = self.request.user).select_related('purchase__course')
    
    @action(detail=True,methods=['get'])
    def download(self,request,pk=None):
        invoice = self.get_object()

        if not invoice.pdf_file:
            return Response({"error":"Invoice not available"},status=404)

        pdf_url = invoice.pdf_file.url 

        pdf_response = requests.get(pdf_url)

        response = HttpResponse(pdf_response.content,content_type='application/pdf')
        response['Content-Disposition'] = f'attachment;filename="invoice={invoice.invoice_number}.pdf"'
        return response
    
    @action(detail=True,methods=['get'])
    def view(self,request,pk=None):
        invoice = self.get_object()
        return Response({"pdf_url":invoice.pdf_file.url})