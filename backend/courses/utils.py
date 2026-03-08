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
from quiz.models import Quiz,UserQuizAttempt

def generate_certificate_id():
    return str(uuid.uuid4())[:12].upper()

def generate_certificate_file(certificate:CourseCertificate):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)

    p.setFont("Helvetica-Bold", 24)
    p.drawCentredString(300, 750, "Certificate of Completion")

    p.setFont("Helvetica", 14)
    p.drawCentredString(300, 700, f"This is to certify that")
    p.setFont("Helvetica-Bold", 16)
    p.drawCentredString(300, 675, certificate.student.username)
    p.setFont("Helvetica", 14)
    p.drawCentredString(300, 650, f"has successfully completed the course")
    p.setFont("Helvetica-Bold", 16)
    p.drawCentredString(300, 625, certificate.course.title)

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

    certificate.certificate_file = upload["secure_url"]
    certificate.save(update_fields=["certificate_file"])

    buffer.close()
    return certificate


def issue_certificate_if_eligible(student, course):
    if CourseCertificate.objects.filter(student=student, course=course).exists():
        return
    
    try:
        purchase = CoursePurchase.objects.get(student=student, course=course)
    except CoursePurchase.DoesNotExist:
        return    

    total_lessons = Lesson.objects.filter(
        module__course=course,
        duration__gt=0,
        is_active=True,
        is_deleted=False,
        created_at__lte=purchase.purchased_at
    ).count()

    completed_lessons = LessonProgress.objects.filter(
        student=student,
        lesson__module__course=course,
        lesson__duration__gt=0,
        completed=True,
        lesson__created__lte=purchase.purchased_at
    ).count()

    if total_lessons == 0 or completed_lessons < total_lessons:
        return
    
    if not purchase:
        return
    
    try:
        quiz = Quiz.objects.get(course=course)
    except Quiz.DoesNotExist:
        return

    passed_attempt = UserQuizAttempt.objects.filter(
        user = student,
        quiz = quiz,
        is_passed = True
    ).exists()

    if not passed_attempt:
        return    

    certificate = CourseCertificate.objects.create(student=student, course=course, issued_at=timezone.now(), certificate_id= generate_certificate_id())

    purchase.progress_locked = True
    purchase.save(update_fields=["progress_locked"])
    
    return generate_certificate_file(certificate)

def verify_certificate(certificate_id: str):
    try:
        cert = CourseCertificate.objects.get(certificate_id=certificate_id)
        
        certificate_url = None
        if cert.certificate_file:
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
    try:
        purchase = CoursePurchase.objects.get(student=student,course=course)
    except CoursePurchase.DoesNotExist:
        return 0
    
    if purchase.progress_locked:
        return 100
        
    total_lessons = Lesson.objects.filter(
        module__course=course,
        duration__gt=0,
        is_active=True,
        is_deleted=False,
        created_at__lte=purchase.purchased_at
    ).count()

    completed_lessons = LessonProgress.objects.filter(
        student=student,
        lesson__module__course=course,
        lesson__duration__gt=0,
        completed=True,
        lesson__created_at__lte=purchase.purchased_at
    ).count()

    if total_lessons == 0 :
        return 0
    
    return round((completed_lessons/total_lessons) * 100,2)
