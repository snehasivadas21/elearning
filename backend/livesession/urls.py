from django.urls import path
from .views import (
  LiveSessionCreateView,LiveSessionListView,LiveSessionUpdateView,LiveSessionDetailView,
  start_session, end_session, cancel_session, 
  LiveSessionParticipantsView
)

urlpatterns = [
  path("tutor/session/", LiveSessionCreateView.as_view(), name="live-create"),
  path("tutor/session/list/", LiveSessionListView.as_view(), name="live-list" ),
  path("tutor/session/<uuid:id>/", LiveSessionUpdateView.as_view(), name="live-update"),
  path("<uuid:id>/", LiveSessionDetailView.as_view(), name="live-detail"),
  path("<uuid:id>/start/", start_session, name="live-start"),
  path("<uuid:id>/end/", end_session, name="live-end"),
  path("<uuid:id>/cancel/", cancel_session, name="live-cancel"),
  path("<uuid:id>/participants/", LiveSessionParticipantsView.as_view(), name="live-participants"),
]