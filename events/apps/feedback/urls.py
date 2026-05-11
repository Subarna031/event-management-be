from django.urls import path
from .views import EventFeedbackListCreateView, FeedbackDetailView, EventFeedbackSummaryView

urlpatterns = [
    path("events/<int:event_id>/", EventFeedbackListCreateView.as_view(), name="event-feedback"),
    path("events/<int:event_id>/summary/", EventFeedbackSummaryView.as_view(), name="event-feedback-summary"),
    path("<int:pk>/", FeedbackDetailView.as_view(), name="feedback-detail"),
]
