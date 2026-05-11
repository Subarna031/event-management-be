from rest_framework import serializers
from django.db.models import Avg
from .models import Category, Event, UserEventInteraction
from apps.users.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    event_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "event_count"]


class EventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer — all heavy fields come from queryset annotations."""

    category_name = serializers.CharField(source="category.name", read_only=True, default="")
    category_slug = serializers.CharField(source="category.slug", read_only=True, default="")
    organizer_name = serializers.CharField(source="organizer.username", read_only=True)
    organizer_avatar = serializers.ImageField(source="organizer.profile_image", read_only=True)

    # Annotation-backed fields — set in ViewSet.get_queryset()
    registration_count = serializers.IntegerField(read_only=True, default=0)
    available_spots = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id", "title", "category", "category_name", "category_slug",
            "tags", "date", "end_date", "venue", "city",
            "capacity", "registration_count", "available_spots", "is_full",
            "banner_image", "organizer", "organizer_name", "organizer_avatar",
            "status", "is_registered", "created_at",
        ]

    def get_available_spots(self, obj):
        return max(0, obj.capacity - getattr(obj, "registration_count", 0))

    def get_is_full(self, obj):
        return self.get_available_spots(obj) <= 0

    def get_is_registered(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.tickets.filter(user=request.user).exists()
        return False


class OrganizerProfileSerializer(serializers.ModelSerializer):
    """Minimal organizer info shown inside EventDetailSerializer."""
    total_events = serializers.SerializerMethodField()

    class Meta:
        from apps.users.models import User
        model = User
        fields = ["id", "username", "email", "profile_image", "bio", "total_events"]

    def get_total_events(self, obj):
        return obj.organized_events.filter(status="published").count()


class EventDetailSerializer(serializers.ModelSerializer):
    """Full serializer for the detail page."""

    category_name = serializers.CharField(source="category.name", read_only=True, default="")
    category_slug = serializers.CharField(source="category.slug", read_only=True, default="")
    organizer = OrganizerProfileSerializer(read_only=True)

    registration_count = serializers.IntegerField(read_only=True, default=0)
    available_spots = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    rating_distribution = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id", "title", "description",
            "category", "category_name", "category_slug",
            "tags", "date", "end_date", "venue", "city",
            "capacity", "registration_count", "available_spots", "is_full",
            "banner_image", "organizer", "status",
            "is_registered", "avg_rating", "rating_distribution",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "organizer", "created_at", "updated_at"]

    def get_available_spots(self, obj):
        return max(0, obj.capacity - getattr(obj, "registration_count", 0))

    def get_is_full(self, obj):
        return self.get_available_spots(obj) <= 0

    def get_is_registered(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.tickets.filter(user=request.user).exists()
        return False

    def get_avg_rating(self, obj):
        result = obj.feedbacks.aggregate(avg=Avg("rating"))
        avg = result["avg"]
        return round(avg, 1) if avg else None

    def get_rating_distribution(self, obj):
        return {
            str(i): obj.feedbacks.filter(rating=i).count()
            for i in range(1, 6)
        }


class EventCreateSerializer(serializers.ModelSerializer):
    """Used for POST (create) and PATCH (update) by organizers."""

    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list,
    )

    class Meta:
        model = Event
        fields = [
            "title", "description", "category", "tags",
            "date", "end_date", "venue", "city",
            "capacity", "banner_image", "status",
        ]

    def validate(self, attrs):
        if attrs.get("end_date") and attrs["end_date"] <= attrs["date"]:
            raise serializers.ValidationError(
                {"end_date": "End date must be after the start date."}
            )
        if attrs.get("capacity", 0) < 1:
            raise serializers.ValidationError(
                {"capacity": "Capacity must be at least 1."}
            )
        return attrs


class UserEventInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserEventInteraction
        fields = ["id", "user", "event", "action", "timestamp"]
        read_only_fields = ["id", "user", "timestamp"]
