from decimal import Decimal
from django.db import transaction
from .models import InstructorWallet, WalletTransaction, PlatformRevenue

COMMISSION_PERCENTAGE = Decimal("20") 

def credit_instructor_wallet(order):
    total_amount = order.amount
    commission_amount = (total_amount * COMMISSION_PERCENTAGE) / 100
    instructor_amount = total_amount - commission_amount


    PlatformRevenue.objects.create(
        order=order,
        total_amount=total_amount,
        commission_amount=commission_amount
    )

    instructor = order.course.instructor

    wallet, _ = InstructorWallet.objects.get_or_create(
        instructor=instructor
    )

    wallet.available_balance += instructor_amount
    wallet.total_earned += instructor_amount
    wallet.save()

    WalletTransaction.objects.create(
        wallet=wallet,
        transaction_type=WalletTransaction.CREDIT,
        amount=instructor_amount,
        refrence=f"ORDER-{order.order_id}"
    )
