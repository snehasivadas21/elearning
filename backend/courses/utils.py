import os,io
import uuid 
import cloudinary.uploader
from cloudinary import CloudinaryImage
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

    upload = cloudinary.uploader.upload(
        buffer,
        resource_type="raw",
        folder="media/certificates",
        public_id=f"{certificate.certificate_id}",
        overwrite=True
    )

    certificate.certificate_file = upload["public_id"]
    certificate.save(update_fields=["certificate_file"])

    buffer.close()
    return certificate


def issue_certificate_if_eligible(student, course):
    if CourseCertificate.objects.filter(student=student, course=course).exists():
        return

    total_lessons = Lesson.objects.filter(
        module__course=course,
        duration__gt=0
    ).count()

    completed_lessons = LessonProgress.objects.filter(
        student=student,
        lesson__module__course=course,
        lesson__duration__gt=0,
        completed=True
    ).count()

    if total_lessons == 0 or completed_lessons < total_lessons:
        return

    if not CoursePurchase.objects.filter(student=student, course=course).exists():
        return

    certificate = CourseCertificate.objects.create(student=student, course=course, issued_at=timezone.now(), certificate_id= generate_certificate_id())
    return generate_certificate_file(certificate)

def verify_certificate(certificate_id: str):
    try:
        cert = CourseCertificate.objects.get(certificate_id=certificate_id)
        
        certificate_url = None
        if cert.certificate_file:
            # ✅ same fix here
            certificate_url, _ = cloudinary.utils.cloudinary_url(
                cert.certificate_file.name,
                resource_type="raw",
                secure=True
            )
        
        return {
            "student": cert.student.username,
            "course": cert.course.title,
            "issued_at": cert.issued_at,
            "certificate_url": certificate_url,            
        } 
    except CourseCertificate.DoesNotExist:
        return None   
    
def get_course_progress(student,course):
    total_lessons = Lesson.objects.filter(
        module__course=course,
        duration__gt=0
    ).count()

    completed_lessons = LessonProgress.objects.filter(
        student=student,
        lesson__module__course=course,
        lesson__duration__gt=0,
        completed=True
    ).count()

    if total_lessons == 0 :
        return 0
    
    return round((completed_lessons/total_lessons) * 100,2)

# def get_course_progress(student, course):
#     lessons = Lesson.objects.filter(
#         module__course=course,
#         is_active=True,
#         duration__gt=0  # only lessons with known duration
#     )

#     total_duration = lessons.aggregate(total=models.Sum('duration'))['total'] or 0
#     if total_duration == 0:
#         return 0

#     # Get watched seconds for each lesson (capped at lesson duration)
#     lesson_ids = lessons.values_list('id', flat=True)
#     progresses = LessonProgress.objects.filter(
#         student=student,
#         lesson__in=lesson_ids
#     ).select_related('lesson')

#     watched_duration = 0
#     for p in progresses:
#         # cap watched at lesson duration so one lesson can't exceed 100%
#         capped = min(p.watched_seconds, p.lesson.duration)
#         watched_duration += capped

#     return round((watched_duration / total_duration) * 100, 2)