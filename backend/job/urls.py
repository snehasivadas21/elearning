from rest_framework.routers import DefaultRouter
from .views import RecruiterProfileViewSet,JobPostingViewSet,ApplicationViewSet,RecruiterDashboardViewSet

router = DefaultRouter()
router.register("profiles",RecruiterProfileViewSet,basename="recruiter-profiles")
router.register("jobs",JobPostingViewSet,basename="jobs")
router.register("applications",ApplicationViewSet,basename="applications")
router.register("dashboard",RecruiterDashboardViewSet,basename="recruiter-dashboard")

urlpatterns = router.urls