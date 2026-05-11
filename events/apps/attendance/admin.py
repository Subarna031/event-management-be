from django.contrib import admin
from .models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("ticket", "scanned_at", "scanned_by")
    search_fields = ("ticket__user__email", "ticket__event__title")
    readonly_fields = ("scanned_at",)
