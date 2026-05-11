from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import Ticket
from .serializers import TicketSerializer


class MyTicketsView(generics.ListAPIView):
    serializer_class = TicketSerializer

    def get_queryset(self):
        return Ticket.objects.filter(user=self.request.user).select_related(
            "event", "event__category"
        )


class TicketDetailView(generics.RetrieveAPIView):
    serializer_class = TicketSerializer

    def get_queryset(self):
        return Ticket.objects.filter(user=self.request.user)
