from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/events/", include("apps.events.urls")),
    path("api/tickets/", include("apps.tickets.urls")),
    path("api/attendance/", include("apps.attendance.urls")),
    path("api/feedback/", include("apps.feedback.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/recommendations/", include("apps.recommendations.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
