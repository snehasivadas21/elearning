import os,io
import uuid 
from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone
from reportlab.pdfgen import canvas
from django.db import models 

from .models import Lesson, LessonProgress,CourseCertificate
from payment.models import CoursePurchase

def generate_certificate_id():
    return str(uuid.uuid4())[:12].upper()

def generate_certificate_file(certificate:CourseCertificate):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)

    # Title
    p.setFont("Helvetica-Bold", 24)
    p.drawCentredString(300, 750, "Certificate of Completion")

    # Body text
    p.setFont("Helvetica", 14)
    p.drawCentredString(300, 700, f"This is to certify that")
    p.setFont("Helvetica-Bold", 16)
    p.drawCentredString(300, 675, certificate.student.username)
    p.setFont("Helvetica", 14)
    p.drawCentredString(300, 650, f"has successfully completed the course")
    p.setFont("Helvetica-Bold", 16)
    p.drawCentredString(300, 625, certificate.course.title)

    # Footer
    p.setFont("Helvetica", 12)
    p.drawCentredString(300, 580, f"Issued on: {certificate.issued_at.strftime('%d %B %Y')}")
    p.drawCentredString(300, 560, f"Certificate ID: {certificate.certificate_id}")

    p.showPage()
    p.save()

    buffer.seek(0)

    # Save to Cloudinary via FileField
    certificate.certificate_file.save(
        f"{certificate.certificate_id}.pdf",
        ContentFile(buffer.read()),
        save=True
    )
    buffer.close()
    return certificate


def issue_certificate_if_eligible(student, course):
    # Already issued?
    if CourseCertificate.objects.filter(student=student, course=course).exists():
        return

    # All lessons completed?
    total_lessons = Lesson.objects.filter(module__course=course, is_active=True).count()
    completed_lessons = LessonProgress.objects.filter(student=student, lesson__module__course=course,completed=True).count()
    if total_lessons == 0 or completed_lessons < total_lessons:
        return

    # If course is paid, ensure it's purchased
    if not CoursePurchase.objects.filter(student=student, course=course).exists():
        return

    # All checks passed — issue certificate
    certificate = CourseCertificate.objects.create(student=student, course=course, issued_at=timezone.now(), certificate_id= generate_certificate_id())
    return generate_certificate_file(certificate)

def verify_certificate(certificate_id:str):
    try:
        cert = CourseCertificate.objects.get(certificate_id=certificate_id)
        return {
            "student" : cert.student.username,
            "course" : cert.course.title,
            "issued_at" : cert.issued_at,
            "certificate_url" : cert.certificate_file.url if cert.certificate_file else None,            
        } 
    except CourseCertificate.DoesNotExist:
        return None    
    
def get_course_progress(student,course):
    total_lessons = course.modules.all().prefetch_related("lesson").aggregate(
        total = models.Count("lessons")
    )["total"] or 0

    completed_lessons = LessonProgress.objects.filter(
        student = student,lesson__module__course =course,completed = True
    ).count()


    if total_lessons == 0 :
        return 0
    
    return round((completed_lessons/total_lessons) * 100,2)