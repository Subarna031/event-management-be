from celery import shared_task
from django.core.mail import EmailMessage
from django.conf import settings
import uuid


@shared_task(bind=True, max_retries=3)
def send_ticket_email(self, ticket_id: str):
    """Send QR ticket confirmation email after registration."""
    from .models import Ticket

    try:
        ticket = Ticket.objects.select_related("user", "event").get(id=ticket_id)
    except Ticket.DoesNotExist:
        return

    user = ticket.user
    event = ticket.event

    subject = f"Your Ticket — {event.title}"
    body = (
        f"Hi {user.username},\n\n"
        f"You're registered for {event.title}!\n\n"
        f"Date: {event.date.strftime('%B %d, %Y at %I:%M %p')}\n"
        f"Venue: {event.venue}\n\n"
        f"Your QR ticket is attached. Present it at the event entrance.\n\n"
        f"Ticket ID: {ticket.id}\n\n"
        f"See you there!\n— Event Management Team"
    )

    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )

    if ticket.qr_code_image:
        try:
            ticket.qr_code_image.open()
            email.attach(
                f"ticket_{ticket.id}.png",
                ticket.qr_code_image.read(),
                "image/png",
            )
        except Exception:
            pass

    try:
        email.send(fail_silently=False)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
