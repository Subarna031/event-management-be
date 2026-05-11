from rest_framework import serializers
from .models import Attendance
from apps.tickets.serializers import TicketSerializer


class AttendanceSerializer(serializers.ModelSerializer):
    ticket_detail = TicketSerializer(source="ticket", read_only=True)
    scanned_by_email = serializers.EmailField(source="scanned_by.email", read_only=True)

    class Meta:
        model = Attendance
        fields = ["id", "ticket", "ticket_detail", "scanned_at", "scanned_by", "scanned_by_email"]
        read_only_fields = ["id", "scanned_at", "scanned_by"]


class CheckInSerializer(serializers.Serializer):
    qr_token = serializers.UUIDField(help_text="Ticket UUID scanned from QR code")
