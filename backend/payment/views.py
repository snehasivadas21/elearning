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
from revenue.services import credit_instructor_wallet
from django.db import transaction
import razorpay
import hmac
import hashlib
import requests
import logging
from rest_framework.decorators import api_view
from .utils import generate_invoice_number,create_invoice_pdf

logger = logging.getLogger(__name__)

razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class CoursePurchaseViewSet(viewsets.ModelViewSet):
    serializer_class =  CoursePurchaseSerializer
    permission_classes =[permissions.IsAuthenticated,IsStudentUser]

    def get_queryset(self):
        logger.info(f"Fetching purchases for user {self.request.user.id}")

        qs = CoursePurchase.objects.filter(student=self.request.user).select_related("course","course__category","course__instructor")
        course_id = self.request.query_params.get("course_id")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs    

    def perform_create(self, serializer):
        course = serializer.validated_data['course']

        if CoursePurchase.objects.filter(student=self.request.user,course=course).exists():
            logger.warning(
                f"User {self.request.user.id} tried to enroll twice in course {course.id}"
            )
            raise serializers.ValidationError("You are already enrolled in this course.")
        serializer.save(student=self.request.user)

        logger.info(
            f"User {self.request.user.id} enrolled in course {course.id}"
        )

    @action(detail=False,methods=["get"])
    def enrolled(self,request):
        course_id = request.query_params.get("course_id")

        enrolled = CoursePurchase.objects.filter(
            student = request.user,
            course_id = course_id
        ).exists()
        logger.info(
            f"Enrollment check for user {request.user.id} course {course_id}: {enrolled}"
        )
        return Response({"enrolled":enrolled})    

class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        logger.info(f"Fetching orders for user {self.request.user.id}")

        return Order.objects.filter(
            student=self.request.user
        ).select_related("course").order_by("-created_at")

class CreateRazorpayOrder(APIView):
    permission_classes = [permissions.IsAuthenticated,IsStudentUser]

    def post(self,request):
        course_id = request.data.get("course_id")

        logger.info(
            f"Create Razorpay order request by user {request.user.id} for course {course_id}"
        )

        course = Course.objects.get(id=course_id,is_published=True)

        if CoursePurchase.objects.filter(
            student = request.user,
            course=course
        ).exists():
            logger.warning(
                f"User {request.user.id} attempted to repurchase course {course.id}"
            )

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

        logger.info(
            f"Razorpay order created {razorpay_order['id']} for user {request.user.id}"
        )

        return Response({
            "razorpay_order_id" : razorpay_order['id'],
            "amount" : amount_paise,
            "currency" : "INR",
            "course_id" : course.id,
            "key" : settings.RAZORPAY_KEY_ID
        })

class RetryRazorpayOrder(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudentUser]

    def post(self, request):
        old_order_id = request.data.get("order_id")

        if not old_order_id:
            return Response({"error": "order_id required"}, status=400)
        
        logger.info(
            f"Retry payment requested by user {request.user.id} for order {old_order_id}"
        )

        try:
            old_order = Order.objects.get(
                order_id=old_order_id,
                student=request.user
            )
        except Order.DoesNotExist:

            logger.error(
                f"Retry failed: order {old_order_id} not found for user {request.user.id}"
            )

            return Response({"error": "Order not found"}, status=404)

        if CoursePurchase.objects.filter(
            student=request.user,
            course=old_order.course
        ).exists():
            
            logger.warning(
                f"User {request.user.id} retried payment but already purchased course {old_order.course.id}"
            )

            return Response({"error": "Course already purchased"}, status=400)

        Order.objects.filter(
            student=request.user,
            course=old_order.course
        ).exclude(status="completed").update(status="failed")

        amount_paise = int(old_order.amount * 100)

        try:
            razorpay_order = razorpay_client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "payment_capture": 1
            })
        except Exception as e:
            logger.error(f"Razorpay order retry failed: {str(e)}")
            return Response(
                {"error": str(e)},
                status=500
            )

        new_order = Order.objects.create(
            student=request.user,
            course=old_order.course,
            order_id=razorpay_order["id"],
            amount=old_order.amount,
            status="pending"
        )

        logger.info(
            f"Retry order created {new_order.order_id} for user {request.user.id}"
        )

        return Response({
            "razorpay_order_id": new_order.order_id,
            "amount": amount_paise,
            "currency": "INR",
            "course_id": old_order.course.id,
            "key": settings.RAZORPAY_KEY_ID
        })

class VerifyRazorpayPayment(APIView):
    permission_classes = [permissions.IsAuthenticated,IsStudentUser]

    def post(self, request):
        data = request.data
        order_id = data.get('razorpay_order_id')
        payment_id = data.get('razorpay_payment_id')
        signature = data.get('razorpay_signature')

        logger.info(
            f"Payment verification started for order {order_id} by user {request.user.id}"
        )

        generated_signature = hmac.new(
            bytes(settings.RAZORPAY_KEY_SECRET, 'utf-8'),
            bytes(f"{order_id}|{payment_id}", 'utf-8'),
            hashlib.sha256
        ).hexdigest()

        if generated_signature != signature:

            logger.error(
                f"Payment signature mismatch for order {order_id}"
            )

            return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            order = Order.objects.select_for_update().get(order_id=order_id, student=request.user)

            if order.status == 'completed':

                logger.info(
                    f"Payment already processed for order {order_id}"
                )

                return Response({
                    "message":"Already processed",
                    "course_id":order.course.id})

            purchase,created = CoursePurchase.objects.get_or_create(
                student=request.user,
                course=order.course,
            )
            
            order.purchase = purchase
            order.payment_id = payment_id
            order.status = 'completed'
            order.save()

            logger.info(
                f"Payment verified successfully for order {order_id}"
            )

            credit_instructor_wallet(order)

            Order.objects.filter(
                student = request.user,
                course = order.course
            ).exclude(id=order.id).update(status="failed")

            invoice, inv_created = Invoice.objects.get_or_create(
                purchase=purchase,
                defaults={
                    "student": request.user,
                    "invoice_number": generate_invoice_number()
                }
            )

            if inv_created:

                logger.info(
                    f"Generating invoice for order {order_id}"
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
        logger.info(f"Fetching invoices for user {self.request.user.id}")

        return Invoice.objects.filter(student = self.request.user).select_related('purchase__course')
    
    @action(detail=True,methods=['get'])
    def download(self,request,pk=None):
        invoice = self.get_object()

        if not invoice.pdf_file:
            logger.warning(f"Invoice {invoice.id} requested but PDF missing")
            return Response({"error":"Invoice not available"},status=404)

        pdf_response = requests.get(invoice.pdf_file)

        logger.info(
            f"Invoice {invoice.invoice_number} downloaded by user {request.user.id}"
        )

        response = HttpResponse(pdf_response.content,content_type='application/pdf')
        response['Content-Disposition'] = f'attachment;filename="invoice={invoice.invoice_number}.pdf"'
        return response
    
    @action(detail=True,methods=['get'])
    def view(self,request,pk=None):
        invoice = self.get_object()

        if not invoice.pdf_file:
            return Response({"error": "Invoice not available"}, status=404)

        logger.info(
            f"Invoice {invoice.invoice_number} viewed by user {request.user.id}"
        )

        return Response({"pdf_url":invoice.pdf_file})