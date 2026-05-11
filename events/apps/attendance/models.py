from django.db import models
from django.conf import settings


class Attendance(models.Model):
    ticket = models.OneToOneField(
        "tickets.Ticket", on_delete=models.CASCADE, related_name="attendance"
    )
    scanned_at = models.DateTimeField(auto_now_add=True)
    scanned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="scanned_attendances",
    )

    class Meta:
        app_label = "attendance"

    def __str__(self):
        return f"{self.ticket.user.email} — {self.ticket.event.title}"
