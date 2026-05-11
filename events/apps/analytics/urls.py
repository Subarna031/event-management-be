from django.urls import path
from .views import EventAnalyticsView, OrganizerDashboardView

urlpatterns = [
    path("events/<int:event_id>/", EventAnalyticsView.as_view(), name="event-analytics"),
    path("dashboard/", OrganizerDashboardView.as_view(), name="organizer-dashboard"),
]
