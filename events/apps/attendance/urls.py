from django.urls import path
from .views import CheckInView, EventAttendanceListView

urlpatterns = [
    path("check-in/", CheckInView.as_view(), name="check-in"),
    path("event/<int:event_id>/", EventAttendanceListView.as_view(), name="event-attendance"),
]
