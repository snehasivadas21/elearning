from django.urls import path
from .views import (
  LiveSessionCreateView, LiveSessionDetailView,
  start_session, end_session, LiveSessionParticipantsView
)

urlpatterns = [
  path("", LiveSessionCreateView.as_view(), name="live-create"),
  path("<uuid:id>/", LiveSessionDetailView.as_view(), name="live-detail"),
  path("<uuid:id>/start/", start_session, name="live-start"),
  path("<uuid:id>/end/", end_session, name="live-end"),
  path("<uuid:id>/participants/", LiveSessionParticipantsView.as_view(), name="live-participants"),
]