from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import ( TutorRequestPayoutAPIView,AdminPayoutViewSet,TutorWalletSummaryAPIView,
                    TutorWalletTransactionsAPIView, TutorPayoutHistoryAPIView,AdminRevenueTransactionsAPIView,
                    AdminTotalRevenueAPIView,AdminRevenueByCourseAPIView,AdminRevenueByInstructorAPIView,)

router = DefaultRouter()
router.register("admin/payout", AdminPayoutViewSet, basename="admin-payout")

urlpatterns = [
    path("tutor/payout/request/", TutorRequestPayoutAPIView.as_view(), name="request-payout"),
    path("tutor/wallet/", TutorWalletSummaryAPIView.as_view(), name="tutor-wallet-summary"),
    path("tutor/wallet/transactions/",TutorWalletTransactionsAPIView.as_view(),name="tutor-wallet-transactions"),
    path("tutor/payouts/",TutorPayoutHistoryAPIView.as_view(),name="tutor-payout-history"),

    path("admin/revenue/total/", AdminTotalRevenueAPIView.as_view(),name="admin-revenue"),
    path("admin/revenue/by-course/", AdminRevenueByCourseAPIView.as_view(),name="admin-course-revenue"),
    path("admin/revenue/by-instructor/", AdminRevenueByInstructorAPIView.as_view(),name="admin-tutor-revenue"),
    path("admin/revenue/transactions/",AdminRevenueTransactionsAPIView.as_view(),name="admin-revenue-transactions"),

    path('', include(router.urls)),

]
