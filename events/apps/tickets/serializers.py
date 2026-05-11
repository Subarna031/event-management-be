from rest_framework import serializers
from .models import Ticket
from apps.events.serializers import EventListSerializer
from apps.users.serializers import UserSerializer


class TicketSerializer(serializers.ModelSerializer):
    event_detail = EventListSerializer(source="event", read_only=True)
    user_detail = UserSerializer(source="user", read_only=True)
    qr_code_url = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id", "user", "user_detail", "event", "event_detail",
            "qr_code_image", "qr_code_url", "is_used", "created_at",
        ]
        read_only_fields = ["id", "qr_code_image", "is_used", "created_at"]

    def get_qr_code_url(self, obj):
        request = self.context.get("request")
        if obj.qr_code_image and request:
            return request.build_absolute_uri(obj.qr_code_image.url)
        return None
