from django.db.models import Count, Avg
from django.db.models.functions import TruncDate
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsOrganizer
from apps.events.models import Event, UserEventInteraction
from apps.tickets.models import Ticket
from apps.attendance.models import Attendance
from apps.feedback.models import Feedback


class EventAnalyticsView(APIView):
    """Per-event dashboard for organizers."""
    permission_classes = [IsOrganizer]

    def get(self, request, event_id):
        try:
            event = Event.objects.get(id=event_id, organizer=request.user)
        except Event.DoesNotExist:
            return Response({"error": "Event not found."}, status=404)

        tickets = Ticket.objects.filter(event=event)
        registrations_over_time = (
            tickets.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        attended = Attendance.objects.filter(ticket__event=event).count()
        total_registered = tickets.count()
        attendance_rate = (attended / total_registered * 100) if total_registered else 0

        feedback_stats = Feedback.objects.filter(event=event).aggregate(
            avg_rating=Avg("rating"), total_reviews=Count("id")
        )

        return Response(
            {
                "event_id": event.id,
                "event_title": event.title,
                "capacity": event.capacity,
                "total_registered": total_registered,
                "total_attended": attended,
                "attendance_rate": round(attendance_rate, 1),
                "registrations_over_time": list(registrations_over_time),
                "avg_rating": feedback_stats["avg_rating"],
                "total_reviews": feedback_stats["total_reviews"],
            }
        )


class OrganizerDashboardView(APIView):
    """Aggregate stats across all events owned by the organizer."""
    permission_classes = [IsOrganizer]

    def get(self, request):
        events = Event.objects.filter(organizer=request.user)
        total_events = events.count()

        event_ids = events.values_list("id", flat=True)
        total_registrations = Ticket.objects.filter(event_id__in=event_ids).count()
        total_attended = Attendance.objects.filter(ticket__event_id__in=event_ids).count()
        avg_rating = Feedback.objects.filter(event_id__in=event_ids).aggregate(
            avg=Avg("rating")
        )["avg"]

        top_events = (
            events.annotate(reg_count=Count("tickets"))
            .order_by("-reg_count")[:5]
            .values("id", "title", "reg_count", "date")
        )

        return Response(
            {
                "total_events": total_events,
                "total_registrations": total_registrations,
                "total_attended": total_attended,
                "avg_rating": round(avg_rating, 1) if avg_rating else None,
                "top_events": list(top_events),
            }
        )
