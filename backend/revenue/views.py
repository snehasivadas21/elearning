from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework import viewsets,permissions,status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import transaction
from django.db.models import Sum,Count,F
from .models import InstructorWallet, PayoutRequest,WalletTransaction,PlatformRevenue,PaymentAccount
from .serializers import (PayoutRequestSerializer, WalletTransactionSerializer, AdminPendingPayoutSerializer,
                          TutorPayoutSerializer, PlatformRevenueTransactionSerializer,PaymentAccountSerializer)
from users.permissions import IsInstructorUser,IsAdminUser
import logging

logger = logging.getLogger(__name__)    

class AdminPayoutViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdminPendingPayoutSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = PayoutRequest.objects.select_related("instructor").order_by("-created_at")

        status_filter = self.request.query_params.get("status")
        if status_filter and status_filter != "ALL":
            queryset = queryset.filter(status=status_filter)

        return queryset

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        logger.info(f"Admin {request.user.id} attempting to mark payout {pk} as PAID")
        try:
            with transaction.atomic():
                payout = PayoutRequest.objects.select_for_update().get(id=pk)

                if payout.status == PayoutRequest.PAID:
                    logger.warning(f"Payout {pk} already marked as PAID")
                    return Response(
                        {"message": "Already marked as PAID"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if payout.status not in [PayoutRequest.PENDING,PayoutRequest.APPROVED]:
                    logger.warning(
                        f"Invalid payout state for payout {pk} | "
                        f"Current status = {payout.status}"
                    )
                    return Response(
                        {"error":"Invalid payout state"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                wallet = InstructorWallet.objects.select_for_update().get(
                    instructor=payout.instructor
                )

                wallet.available_balance -= payout.amount
                wallet.pending_balance -= payout.amount
                wallet.save()

                WalletTransaction.objects.create(
                    wallet=wallet,
                    transaction_type=WalletTransaction.DEBIT,
                    amount=payout.amount,
                    refrence=f"PAYOUT-{payout.id}"
                )

                payout.status = PayoutRequest.PAID
                payout.save()

                logger.info(
                    f"Payout {payout.id} marked as PAID | "
                    f"Instructor={payout.instructor.id} | "
                    f"Amount = {payout.amount}"
                )

                return Response(
                    {"message": "Payout marked as PAID"},
                    status=status.HTTP_200_OK
                )

        except PayoutRequest.DoesNotExist:
            logger.error(f"Payout {pk} not found while attempting mark_paid")
            return Response(
                {"error": "Payout not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        except Exception as e:
            logger.critical(
                f"Critical error while marking payout {pk} as PAID | "
                f"Error={str(e)}"
            )
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        logger.info(f"Admin {request.user.id} attempting to reject payout {pk}")
        try:
            with transaction.atomic():
                payout = PayoutRequest.objects.select_for_update().get(id=pk)

                if payout.status != PayoutRequest.PENDING:
                    logger.warning(
                        f"Invalid reject attempt for payout {pk} | "
                        f"Current status={payout.status}"
                    )
                    return Response(
                        {"error": "Only pending payouts can be rejected"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                wallet = InstructorWallet.objects.select_for_update().get(
                    instructor=payout.instructor
                )
                
                wallet.pending_balance -= payout.amount
                wallet.save()

                payout.status = PayoutRequest.REJECTED
                payout.save()

                logger.info(
                    f"Payout {payout.id} rejected | "
                    f"Instructor={payout.instructor.id} | "
                    f"Amount={payout.amount}"
                )

                return Response(
                    {"message": "Payout rejected and amount refunded"},
                    status=status.HTTP_200_OK
                )

        except PayoutRequest.DoesNotExist:
            logger.error(f"Payout {pk} not found while attempting reject")
            return Response(
                {"error": "Payout not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        except Exception as e:
            logger.critical(
                f"Critical error while rejecting payout {pk} | "
                f"Error={str(e)}"
            )
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentAccountView(RetrieveUpdateAPIView):
    serializer_class = PaymentAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj, created = PaymentAccount.objects.get_or_create(
            instructor=self.request.user
        )
        return obj
    
class TutorRequestPayoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorUser]
    
    def post(self, request):
        logger.info(f"Instructor {request.user.id} attempting payout request")
        serializer = PayoutRequestSerializer(
            data=request.data,
            context={"request": request}
        )
        
        if not serializer.is_valid():
            logger.warning(
                f"Invalid payout request data | "
                f"Instructor={request.user.id} | Errors={serializer.errors}"
            )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        amount = serializer.validated_data["amount"]
        
        try:
            with transaction.atomic():
                wallet = InstructorWallet.objects.select_for_update().get(
                    instructor=request.user
                )
                
                withdrawable = wallet.available_balance - wallet.pending_balance

                if amount <= 0:
                    logger.warning(
                        f"Invalid payout amount | "
                        f"Instructor={request.user.id} | Amount={amount}"
                    )
                    return Response({"error": "Invalid amount"}, status=400)

                if withdrawable <= 0:
                    logger.warning(
                        f"No withdrawable balance | "
                        f"Instructor={request.user.id}"
                    )
                    return Response({"error": "No withdrawable balance"}, status=400)

                if amount > withdrawable:
                    logger.warning(
                        f"Insufficient balance | "
                        f"Instructor={request.user.id} | "
                        f"Requested={amount} | Withdrawable={withdrawable}"
                    )
                    return Response(
                        {
                            "error": "Insufficient withdrawable balance",
                            "available_balance": str(wallet.available_balance),
                            "pending_balance": str(wallet.pending_balance),
                            "withdrawable_balance": str(withdrawable),
                        },
                        status=400,
                    )
                
                # Get or create payment account
                payment_obj, created = PaymentAccount.objects.get_or_create(
                    instructor=request.user
                )

                if created:
                    logger.info(
                        f"Payment account created for Instructor={request.user.id}"
                    )
                
                # Update payment details if provided
                upi_id = serializer.validated_data.get("upi_id", "").strip()
                account_holder = serializer.validated_data.get("account_holder_name", "").strip()
                account_num = serializer.validated_data.get("account_number", "").strip()
                ifsc = serializer.validated_data.get("ifsc_code", "").strip()
                
                if upi_id:
                    payment_obj.upi_id = upi_id
                if account_holder:
                    payment_obj.account_holder_name = account_holder
                if account_num:
                    payment_obj.account_number = account_num
                if ifsc:
                    payment_obj.ifsc_code = ifsc
                
                payment_obj.save()
                
                # Create payout request
                payout = PayoutRequest.objects.create(
                    instructor=request.user,
                    amount=amount,
                    status=PayoutRequest.PENDING
                )

                wallet.pending_balance += amount

                if wallet.pending_balance > wallet.available_balance:
                    logger.critical(
                        f"Wallet corruption detected | "
                        f"Instructor={request.user.id} | "
                        f"Available={wallet.available_balance} | "
                        f"Pending={wallet.pending_balance}"
                    )
                    raise Exception("Invalid wallet state: pending exceeds available")
                
                wallet.save()

                logger.info(
                    f"Payout request created successfully | "
                    f"Instructor={request.user.id} | "
                    f"PayoutID={payout.id} | Amount={amount}"
                )
            
        except Exception as e:
            logger.critical(
                f"Critical failure during payout request | "
                f"Instructor={request.user.id} | Error={str(e)}"
            )
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )    
            
        return Response(
            {
                "message": "Payout request submitted successfully",
                "amount_blocked": str(amount),
                "new_withdrawable_balance": str(wallet.available_balance - wallet.pending_balance)
            },
            status=status.HTTP_201_CREATED
        )
    
class TutorWalletSummaryAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorUser]

    def get(self, request):
        wallet, _ = InstructorWallet.objects.get_or_create(
            instructor=request.user
        )

        return Response({
            "available_balance": wallet.available_balance,
            "total_earned": wallet.total_earned,
            "pending_balance": wallet.pending_balance,
            "withdrawable_balance": wallet.available_balance - wallet.pending_balance
        }) 

class TutorWalletTransactionsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorUser]

    def get(self, request):
        wallet = InstructorWallet.objects.filter(
            instructor=request.user
        ).first()

        if not wallet:
            return Response([])

        transactions = wallet.transactions.order_by("-created_at")

        serializer = WalletTransactionSerializer(transactions, many=True)
        return Response(serializer.data)

class TutorPayoutHistoryAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorUser]

    def get(self, request):
        payouts = PayoutRequest.objects.filter(
            instructor=request.user
        ).order_by("-created_at")

        serializer = TutorPayoutSerializer(payouts, many=True)
        return Response(serializer.data)



class AdminTotalRevenueAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logger.info(f"Admin {request.user.id} accessed total revenue summary")

        data = PlatformRevenue.objects.aggregate(
            total_amount=Sum("total_amount"),
            commission_amount=Sum("commission_amount")
        )

        total_amount = data["total_amount"] or 0
        commission = data["commission_amount"] or 0

        return Response({
            "total_amount": total_amount,
            "commission_amount": commission,
            "instructor_earnings": total_amount - commission
        })

class AdminRevenueByCourseAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        revenue = (
            PlatformRevenue.objects
            .values(
                course_id=F("order__course__id"),
                course_title=F("order__course__title"),
                instructor_name=F("order__course__instructor__username"),
            )
            .annotate(
                sales_count=Count("id"),
                total_amount=Sum("total_amount")
            )
            .order_by("-total_amount")
        )

        return Response(revenue)

class AdminRevenueByInstructorAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        revenue = (
            PlatformRevenue.objects
            .values(
                instructor_id=F("order__course__instructor__id"),
                instructor_name=F("order__course__instructor__username"),
            )
            .annotate(
                total_earned=Sum("total_amount"),
                platform_commission=Sum("commission_amount")
            )
            .order_by("-total_earned")
        )

        payout_map = {
            p["instructor_id"]: p["paid"]
            for p in (
                PayoutRequest.objects
                .filter(status=PayoutRequest.PAID)
                .values("instructor_id")
                .annotate(paid=Sum("amount"))
            )
        }

        for r in revenue:
            paid = payout_map.get(r["instructor_id"], 0)
            r["paid_amount"] = paid
            r["pending_amount"] = r["total_earned"] - r["platform_commission"] - paid

        return Response(revenue)

class AdminRevenueTransactionsAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logger.info(f"Admin {request.user.id} viewed revenue transactions")
        
        transactions = (
            PlatformRevenue.objects
            .select_related("order", "order__course", "order__course__instructor")
            .order_by("-created_at")
        )

        serializer = PlatformRevenueTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
