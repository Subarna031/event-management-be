from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.serializers import EventListSerializer
from .engine import content_based_recommendations, collaborative_recommendations


class RecommendationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        limit = int(request.query_params.get("limit", 10))

        content_based = content_based_recommendations(user, limit=limit)
        collaborative = collaborative_recommendations(user, limit=limit)

        # Merge: collaborative first (higher intent signal), then content-based fill-ins
        seen_ids = set()
        merged = []
        for event in collaborative + content_based:
            if event.id not in seen_ids:
                seen_ids.add(event.id)
                merged.append(event)
            if len(merged) >= limit:
                break

        serializer = EventListSerializer(merged, many=True, context={"request": request})
        return Response(
            {
                "count": len(merged),
                "results": serializer.data,
            }
        )
