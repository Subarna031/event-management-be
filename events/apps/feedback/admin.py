from django.contrib import admin
from .models import Feedback, FeedbackImage


class FeedbackImageInline(admin.TabularInline):
    model = FeedbackImage
    extra = 0
    readonly_fields = ("uploaded_at",)


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("user__email", "event__title")
    inlines = [FeedbackImageInline]
