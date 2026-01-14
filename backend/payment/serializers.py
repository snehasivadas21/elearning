from rest_framework import serializers
from .models import Order,CoursePurchase,Invoice
from courses.serializers import UserCourseDetailSerializer

class CoursePurchaseSerializer(serializers.ModelSerializer):
    course = UserCourseDetailSerializer(read_only=True)
    invoice_id = serializers.IntegerField(
        source="invoice.id",
        read_only=True
    )
    class Meta:
        model = CoursePurchase
        fields = ["id", "course", "purchased_at", "invoice_id"]
        read_only_fields = fields

class OrderSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(
        source="course.title",
        read_only=True
    )
    invoice_number = serializers.CharField(
        source="purchase.invoice.invoice_number",
        read_only=True
    )
    invoice_id = serializers.IntegerField(
        source="purchase.invoice.id",
        read_only=True
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "course_title",
            "amount",
            "status",
            "created_at",
            "order_id",
            "payment_id",
            "invoice_number",
            "invoice_id",
        ]
        read_only_fields = fields

class InvoiceSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='purchase.course.title', read_only=True)
    pdf_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'created_at', 'course_title', 'pdf_url']
        
    def get_pdf_url(self, obj):
        if obj.pdf_file:
            return obj.pdf_file.url if hasattr(obj.pdf_file, 'url') else obj.pdf_file
        return None