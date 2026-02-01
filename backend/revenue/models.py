from django.db import models
from django.conf import settings
from payment.models import Order

class PlatformRevenue(models.Model):
    order = models.OneToOneField(Order,on_delete=models.CASCADE,related_name="platform_revenue")
    total_amount = models.DecimalField(max_digits=10,decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10,decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Revenue - Order {self.order.id}"

class InstructorWallet(models.Model):
    instructor = models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="wallet",limit_choices_to={'role':'instructor'})
    available_balance = models.DecimalField(max_digits=10,decimal_places=2,default=0)
    total_earned = models.DecimalField(max_digits=10,decimal_places=2,default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wallet - {self.instructor.email}"

class WalletTransaction(models.Model):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"

    TRANSACTION_TYPE_CHOICES = (
        (CREDIT,"Credit"),
        (DEBIT,"Debit"),
    )    

    wallet = models.ForeignKey(InstructorWallet,on_delete=models.CASCADE,related_name="transactions")
    transaction_type = models.CharField(max_length=10,choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10,decimal_places=2)
    refrence = models.CharField(max_length=100,blank=True,null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.amount}"

class PayoutRequest(models.Model):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PAID = "PAID"

    STATUS_CHOICES = (
        (PENDING,"Pending"),
        (APPROVED,"Approved"),
        (REJECTED,"Rejected"),
        (PAID,"Paid"),
    )    
    
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="payout_requests",limit_choices_to={'role':'instructor'})
    amount = models.DecimalField(max_digits=10,decimal_places=2)
    status = models.CharField(max_length=10,choices=STATUS_CHOICES,default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payout {self.id} - {self.instructor.email}"
