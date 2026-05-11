from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsOrganizer
from apps.tickets.models import Ticket
from apps.events.models import UserEventInteraction
from .models import Attendance
from .serializers import AttendanceSerializer, CheckInSerializer


class CheckInView(APIView):
    """Organizer scans a QR token to mark attendance."""
    permission_classes = [IsOrganizer]

    def post(self, request):
        serializer = CheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        qr_token = serializer.validated_data["qr_token"]

        try:
            ticket = Ticket.objects.select_related("user", "event").get(id=qr_token)
        except Ticket.DoesNotExist:
            return Response({"error": "Invalid QR code."}, status=status.HTTP_404_NOT_FOUND)

        if ticket.event.organizer != request.user:
            return Response(
                {"error": "You are not the organizer of this event."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if ticket.is_used:
            return Response(
                {"error": "Ticket has already been used.", "ticket_id": str(ticket.id)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.is_used = True
        ticket.save(update_fields=["is_used"])

        attendance = Attendance.objects.create(ticket=ticket, scanned_by=request.user)

        UserEventInteraction.objects.get_or_create(
            user=ticket.user, event=ticket.event, action="attend"
        )

        return Response(
            {
                "message": "Check-in successful.",
                "attendee": ticket.user.email,
                "event": ticket.event.title,
                "scanned_at": attendance.scanned_at,
            },
            status=status.HTTP_200_OK,
        )


class EventAttendanceListView(generics.ListAPIView):
    """Organizer: list all check-ins for a specific event."""
    serializer_class = AttendanceSerializer
    permission_classes = [IsOrganizer]

    def get_queryset(self):
        event_id = self.kwargs["event_id"]
        return Attendance.objects.filter(
            ticket__event_id=event_id,
            ticket__event__organizer=self.request.user,
        ).select_related("ticket__user", "ticket__event", "scanned_by")
