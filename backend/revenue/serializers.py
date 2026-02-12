from rest_framework import serializers
from .models import PayoutRequest, InstructorWallet, WalletTransaction, PlatformRevenue, PaymentAccount

class PayoutRequestSerializer(serializers.ModelSerializer):
    upi_id = serializers.CharField(required=False, allow_blank=True)
    account_holder_name = serializers.CharField(required=False, allow_blank=True)
    account_number = serializers.CharField(required=False, allow_blank=True)
    ifsc_code = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = PayoutRequest
        fields = ["id", "amount", "status", "created_at", "upi_id", 
                  "account_holder_name", "account_number", "ifsc_code"]
        read_only_fields = ["status"]
    
    def validate(self, attrs):
        user = self.context["request"].user
        upi = attrs.get("upi_id", "").strip()
        acc = attrs.get("account_number", "").strip()
        ifsc = attrs.get("ifsc_code", "").strip()
        acc_holder = attrs.get("account_holder_name", "").strip()
        
        # Check if payment details are provided (either UPI or complete bank details)
        has_upi = bool(upi)
        has_bank = bool(acc and ifsc and acc_holder)
        
        if not has_upi and not has_bank:
            # Check existing payment account
            try:
                payment = PaymentAccount.objects.get(instructor=user)
                existing_upi = bool(payment.upi_id)
                existing_bank = bool(payment.account_number and 
                                   payment.ifsc_code and 
                                   payment.account_holder_name)
                
                if not existing_upi and not existing_bank:
                    raise serializers.ValidationError(
                        {"payment": "Provide UPI ID or complete bank details (account number, IFSC code, and account holder name)."}
                    )
            except PaymentAccount.DoesNotExist:
                raise serializers.ValidationError(
                    {"payment": "Provide UPI ID or complete bank details (account number, IFSC code, and account holder name)."}
                )
        
        # Validate bank details are complete if partially provided
        bank_fields = [acc, ifsc, acc_holder]
        bank_provided = [bool(f) for f in bank_fields]
        if any(bank_provided) and not all(bank_provided):
            raise serializers.ValidationError(
                {"payment": "Please provide all bank details: account number, IFSC code, and account holder name."}
            )
        
        return attrs
    
    def validate_amount(self, value):
        user = self.context["request"].user
        
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        
        wallet = InstructorWallet.objects.filter(instructor=user).first()
        if not wallet:
            raise serializers.ValidationError("Wallet not found.")
        
        withdrawable = wallet.available_balance - wallet.pending_balance

        if value > withdrawable:
            raise serializers.ValidationError(
                f"Insufficient wallet balance. Available: {wallet.available_balance}"
            )
        
        return value

class AdminPendingPayoutSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source="instructor.username", read_only=True)
    payment_type = serializers.SerializerMethodField()
    payment_details = serializers.SerializerMethodField()

    class Meta:
        model = PayoutRequest
        fields = [
            "id",
            "instructor_name",
            "amount",
            "status",
            "created_at",
            "payment_type",
            "payment_details",
        ]

    def get_payment_type(self, obj):
        try:
            payment = obj.instructor.payment_account
        except PaymentAccount.DoesNotExist:
            return "NOT_ADDED"

        if payment.upi_id:
            return "UPI"
        elif payment.account_number:
            return "BANK"
        return "UNKNOWN"

    def get_payment_details(self, obj):
        try:
            payment = obj.instructor.payment_account
        except PaymentAccount.DoesNotExist:
            return None

        if payment.upi_id:
            return {
                "upi_id": payment.upi_id
            }

        if payment.account_number:
            masked_account = "XXXXXX" + payment.account_number[-4:]
            return {
                "account_holder_name": payment.account_holder_name,
                "account_number": masked_account,
                "ifsc_code": payment.ifsc_code
            }

        return None
    
class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = [
            "id",
            "transaction_type",
            "amount",
            "refrence",
            "created_at"
        ]  

class TutorPayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutRequest
        fields = [
            "id",
            "amount",
            "status",
            "created_at"
        ]

class PlatformRevenueTransactionSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id")
    course_title = serializers.CharField(source="order.course.title")
    instructor = serializers.CharField(source="order.course.instructor.username")

    class Meta:
        model = PlatformRevenue
        fields = [
            "order_id",
            "course_title",
            "instructor",
            "total_amount",
            "commission_amount",
            "created_at"
        ]

class PaymentAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAccount
        fields = "__all__"
        read_only_fields = ["instructor"]

    def validate(self, data):
        upi = data.get("upi_id")
        acc = data.get("account_number")
        ifsc = data.get("ifsc_code")

        if not upi and not (acc and ifsc):
            raise serializers.ValidationError(
                "Provide either UPI ID or Bank details."
            )

        return data

