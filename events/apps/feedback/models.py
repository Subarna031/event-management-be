from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Feedback(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="feedbacks"
    )
    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="feedbacks"
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "feedback"
        unique_together = ("user", "event")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} — {self.event.title} ({self.rating}★)"


class FeedbackImage(models.Model):
    feedback = models.ForeignKey(Feedback, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="feedback/images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "feedback"

    def __str__(self):
        return f"Image for feedback {self.feedback_id}"
