from django.db import models
from django.conf import settings
from courses.models import Course

class CoursePurchase(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='purchases')
    course = models.ForeignKey(Course,on_delete=models.CASCADE,related_name='purchases')
    is_paid = models.BooleanField(default=False)
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student','course']
    def __str__(self):
        return f"{self.student.email} - {self.course.title}" 

class Order(models.Model):
    PAYMENT_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('completed', 'Completed'),
    ('failed', 'Failed'),
]

    student = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    course = models.ForeignKey(Course,on_delete=models.CASCADE)
    order_id = models.CharField(max_length=100,unique=True)
    payment_id = models.CharField(max_length=100,blank=True,null=True)
    amount = models.DecimalField(max_digits=8,decimal_places=2)
    status = models.CharField(max_length=10,choices=PAYMENT_STATUS_CHOICES,default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course.title} - {self.student.username} - {self.status}"

class Invoice(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="invoices")
    purchase = models.OneToOneField("CoursePurchase",on_delete=models.CASCADE,related_name="invoice")
    invoice_number = models.CharField(max_length=20,unique=True)
    pdf_file = models.FileField(upload_to="invoices/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.student.email}"