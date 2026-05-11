from django.urls import path
from .views import MyTicketsView, TicketDetailView

urlpatterns = [
    path("my/", MyTicketsView.as_view(), name="my-tickets"),
    path("<uuid:pk>/", TicketDetailView.as_view(), name="ticket-detail"),
]
