from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import ArrayField


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        app_label = "events"
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Event(models.Model):
    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("published", "Published"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="events"
    )
    tags = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    venue = models.CharField(max_length=200)
    city = models.CharField(max_length=100, blank=True, default="")
    capacity = models.PositiveIntegerField()
    banner_image = models.ImageField(upload_to="events/banners/", null=True, blank=True)
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organized_events",
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="published")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "events"
        ordering = ["-date"]

    def __str__(self):
        return self.title

    def get_registered_count(self):
        """Fallback for when the queryset annotation is not present."""
        return self.tickets.count()

    @property
    def available_spots(self):
        registered = getattr(self, "registration_count", None)
        if registered is None:
            registered = self.get_registered_count()
        return max(0, self.capacity - registered)

    @property
    def is_full(self):
        return self.available_spots <= 0


class UserEventInteraction(models.Model):
    ACTION_CHOICES = (
        ("view", "View"),
        ("register", "Register"),
        ("attend", "Attend"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interactions"
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="interactions")
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "events"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.user.email} — {self.action} — {self.event.title}"
