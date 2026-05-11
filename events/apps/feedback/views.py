from django.db.models import Avg, Count
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsOwnerOrReadOnly
from .models import Feedback
from .serializers import FeedbackSerializer, FeedbackSummarySerializer


class EventFeedbackListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedbackSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Feedback.objects.filter(event_id=self.kwargs["event_id"]).select_related(
            "user"
        ).prefetch_related("images")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, event_id=self.kwargs["event_id"])


class FeedbackDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return Feedback.objects.all()


class EventFeedbackSummaryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, event_id):
        feedbacks = Feedback.objects.filter(event_id=event_id)
        total = feedbacks.count()
        if total == 0:
            return Response({"avg_rating": None, "total_reviews": 0, "rating_distribution": {}})

        avg = feedbacks.aggregate(avg=Avg("rating"))["avg"]
        dist = {
            str(i): feedbacks.filter(rating=i).count() for i in range(1, 6)
        }
        return Response({
            "avg_rating": round(avg, 1),
            "total_reviews": total,
            "rating_distribution": dist,
        })
