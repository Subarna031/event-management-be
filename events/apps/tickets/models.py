import uuid
import qrcode
from io import BytesIO
from django.core.files import File
from django.db import models
from django.conf import settings


class Ticket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tickets"
    )
    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="tickets"
    )
    qr_code_image = models.ImageField(upload_to="tickets/qr_codes/", blank=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "tickets"
        unique_together = ("user", "event")

    def __str__(self):
        return f"Ticket {self.id} — {self.user.email} — {self.event.title}"

    def generate_qr_code(self):
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(str(self.id))
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        self.qr_code_image.save(
            f"ticket_{self.id}.png", File(buffer), save=False
        )

    def save(self, *args, **kwargs):
        if not self.qr_code_image:
            self.generate_qr_code()
        super().save(*args, **kwargs)
