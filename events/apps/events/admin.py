from django.contrib import admin
from .models import Category, Event, UserEventInteraction


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "organizer", "category", "city", "date", "status", "capacity")
    list_filter = ("status", "category")
    search_fields = ("title", "venue", "city", "organizer__email")
    date_hierarchy = "date"
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("title", "description", "category", "tags", "status")}),
        ("Schedule", {"fields": ("date", "end_date")}),
        ("Location", {"fields": ("venue", "city")}),
        ("Capacity & Media", {"fields": ("capacity", "banner_image")}),
        ("Meta", {"fields": ("organizer", "created_at", "updated_at")}),
    )


@admin.register(UserEventInteraction)
class UserEventInteractionAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "action", "timestamp")
    list_filter = ("action",)
