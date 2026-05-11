import django_filters
from .models import Event, Category


class EventFilter(django_filters.FilterSet):
    """
    Supports all query-param filters for the events list endpoint:
      ?category=<slug>
      ?city=<str>          (case-insensitive contains)
      ?date_from=<date>    (YYYY-MM-DD)
      ?date_to=<date>      (YYYY-MM-DD)
      ?search=<str>        (title OR description — handled by SearchFilter, kept here for doc)
      ?status=<str>        (default: published, see ViewSet.get_queryset)
    """

    category = django_filters.CharFilter(field_name="category__slug", lookup_expr="exact")
    city = django_filters.CharFilter(field_name="city", lookup_expr="icontains")
    date_from = django_filters.DateFilter(field_name="date", lookup_expr="date__gte")
    date_to = django_filters.DateFilter(field_name="date", lookup_expr="date__lte")
    status = django_filters.CharFilter(field_name="status", lookup_expr="exact")

    class Meta:
        model = Event
        fields = ["category", "city", "date_from", "date_to", "status"]
