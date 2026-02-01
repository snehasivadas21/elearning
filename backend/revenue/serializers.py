from rest_framework import serializers
from .models import PayoutRequest, InstructorWallet, WalletTransaction, PlatformRevenue

class PayoutRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutRequest
        fields = ["id", "amount", "status", "created_at"]
        read_only_fields = ["status"]

    def validate_amount(self, value):
        user = self.context["request"].user

        wallet = InstructorWallet.objects.filter(
            instructor=user
        ).first()

        if not wallet:
            raise serializers.ValidationError("Wallet not found.")

        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")

        if value > wallet.available_balance:
            raise serializers.ValidationError("Insufficient wallet balance.")

        return value

class AdminPendingPayoutSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source="instructor.username")

    class Meta:
        model = PayoutRequest
        fields = ["id", "instructor_name", "amount", "created_at", "status"]


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

