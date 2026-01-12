from .models import CoursePurchase
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.core.files.base import ContentFile
import io

def can_access_course(user, course):
    if course.is_free:
        return True
    return CoursePurchase.objects.filter(student=user, course=course, is_paid=True).exists()

def generate_invoice_number():
    today = datetime.now().strftime("%Y%m%d")
    from .models import Invoice
    count = Invoice.objects.count() + 1
    return f"INV{today}{count:04d}"

def create_invoice_pdf(invoice):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)

    # Title
    p.setFont("Helvetica-Bold", 16)
    p.drawString(200, 750, "PyTech Invoice")

    # Student details
    p.setFont("Helvetica", 12)
    p.drawString(50, 700, f"Invoice Number: {invoice.invoice_number}")
    p.drawString(50, 680, f"Date: {invoice.created_at.strftime('%Y-%m-%d')}")
    p.drawString(50, 660, f"Student: {invoice.student.username}")
    p.drawString(50, 640, f"Email: {invoice.student.email}")

    # Course & Payment
    purchase = invoice.purchase
    p.drawString(50, 600, f"Course: {purchase.course.title}")
    p.drawString(50, 580, f"Price: ₹{purchase.amount}")
    p.drawString(50, 560, f"Payment ID: {purchase.payment_id}")

    p.showPage()
    p.save()

    buffer.seek(0)
    return ContentFile(buffer.getvalue(), f"{invoice.invoice_number}.pdf")
