from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.permissions import IsOrganizer, IsEventOwner
from .filters import EventFilter
from .models import Category, Event, UserEventInteraction
from .serializers import (
    CategorySerializer,
    EventListSerializer,
    EventDetailSerializer,
    EventCreateSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Category.objects.annotate(
            event_count=Count("events", filter=Q(events__status="published"))
        )


class EventViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EventFilter
    search_fields = ["title", "description", "venue", "city"]
    ordering_fields = ["date", "created_at", "capacity", "registration_count"]
    ordering = ["-date"]

    def get_serializer_class(self):
        if self.action == "list":
            return EventListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return EventCreateSerializer
        return EventDetailSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        if self.action == "create":
            return [IsOrganizer()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsOrganizer(), IsEventOwner()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        # Annotate registration_count once; model properties read it back via getattr
        qs = (
            Event.objects.select_related("category", "organizer")
            .prefetch_related("tickets", "feedbacks")
            .annotate(registration_count=Count("tickets", distinct=True))
        )

        # Default: only published events unless the requester is an organizer
        # filtering for their own draft/cancelled events
        user = self.request.user
        if user.is_authenticated and getattr(user, "role", None) == "organizer":
            # Organizers can see their own non-published events too
            qs = qs.filter(
                Q(status="published") | Q(organizer=user)
            )
        else:
            # status filter is handled by EventFilter; default to published
            if not self.request.query_params.get("status"):
                qs = qs.filter(status="published")

        return qs

    def perform_create(self, serializer):
        event = serializer.save(organizer=self.request.user)
        UserEventInteraction.objects.create(
            user=self.request.user, event=event, action="view"
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.is_authenticated:
            UserEventInteraction.objects.get_or_create(
                user=request.user, event=instance, action="view"
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    # ── Custom actions ─────────────────────────────────────────────────────────

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def register(self, request, pk=None):
        from apps.tickets.models import Ticket
        from apps.tickets.serializers import TicketSerializer
        from apps.tickets.tasks import send_ticket_email

        event = self.get_object()

        if event.status != "published":
            return Response(
                {"error": "Registrations are not open for this event."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if event.is_full:
            return Response(
                {"error": "This event is fully booked."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket, created = Ticket.objects.get_or_create(user=request.user, event=event)
        if not created:
            return Response(
                {"error": "You are already registered for this event."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        UserEventInteraction.objects.get_or_create(
            user=request.user, event=event, action="register"
        )
        send_ticket_email.delay(str(ticket.id))
        return Response(
            TicketSerializer(ticket, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["delete"], permission_classes=[permissions.IsAuthenticated])
    def unregister(self, request, pk=None):
        from apps.tickets.models import Ticket

        event = self.get_object()
        deleted, _ = Ticket.objects.filter(user=request.user, event=event).delete()
        if not deleted:
            return Response(
                {"error": "You are not registered for this event."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"message": "Registration cancelled."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], permission_classes=[IsOrganizer])
    def attendees(self, request, pk=None):
        from apps.tickets.models import Ticket
        from apps.tickets.serializers import TicketSerializer

        event = self.get_object()
        if event.organizer != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        tickets = Ticket.objects.filter(event=event).select_related("user")
        return Response(TicketSerializer(tickets, many=True, context={"request": request}).data)

    @action(detail=False, methods=["get"], permission_classes=[IsOrganizer])
    def my_events(self, request):
        """Return all events created by the authenticated organizer."""
        qs = (
            Event.objects.filter(organizer=request.user)
            .annotate(registration_count=Count("tickets", distinct=True))
            .order_by("-created_at")
        )
        serializer = EventListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)
