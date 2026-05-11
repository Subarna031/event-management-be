from django.contrib import admin
from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "event", "is_used", "created_at")
    list_filter = ("is_used",)
    search_fields = ("user__email", "event__title")
    readonly_fields = ("id", "qr_code_image", "created_at")
