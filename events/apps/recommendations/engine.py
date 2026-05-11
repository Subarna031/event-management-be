"""
Recommendation engine:
  - content_based_recommendations: cosine similarity on category/tag vectors
  - collaborative_recommendations: Jaccard similarity on attended-event sets
"""
from collections import defaultdict

import numpy as np
from django.contrib.auth import get_user_model
from django.db.models import QuerySet

from apps.events.models import Event, UserEventInteraction
from apps.tickets.models import Ticket

User = get_user_model()


def _build_category_vector(event: Event, all_categories: list[str]) -> np.ndarray:
    """One-hot vector over categories + tags."""
    features = []
    cat_name = event.category.name if event.category else ""
    for cat in all_categories:
        features.append(1.0 if cat == cat_name else 0.0)
    return np.array(features, dtype=float)


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def content_based_recommendations(user: User, limit: int = 10) -> QuerySet:
    """
    Recommend events whose category matches the user's interaction history
    or declared interests, using cosine similarity.
    """
    interacted_categories = set(
        UserEventInteraction.objects.filter(user=user)
        .select_related("event__category")
        .values_list("event__category__name", flat=True)
    )
    user_interests = set(user.interests or [])
    user_profile = interacted_categories | user_interests

    if not user_profile:
        return Event.objects.filter(status="published").order_by("-date")[:limit]

    all_categories = list(
        Event.objects.filter(status="published")
        .select_related("category")
        .values_list("category__name", flat=True)
        .distinct()
    )
    all_categories = [c for c in all_categories if c]

    user_vec = np.array([1.0 if c in user_profile else 0.0 for c in all_categories])

    already_registered = set(
        Ticket.objects.filter(user=user).values_list("event_id", flat=True)
    )

    candidate_events = (
        Event.objects.filter(status="published")
        .exclude(id__in=already_registered)
        .select_related("category")
    )

    scored = []
    for event in candidate_events:
        event_vec = _build_category_vector(event, all_categories)
        score = _cosine_similarity(user_vec, event_vec)
        scored.append((score, event.id))

    scored.sort(reverse=True)
    top_ids = [eid for _, eid in scored[:limit]]

    events = {e.id: e for e in Event.objects.filter(id__in=top_ids)}
    return [events[eid] for eid in top_ids if eid in events]


def collaborative_recommendations(user: User, limit: int = 10) -> list:
    """
    Find users with similar attended-event sets (Jaccard similarity),
    then recommend events those similar users attended that the current
    user has not yet registered for.
    """
    user_attended = set(
        Ticket.objects.filter(user=user, is_used=True).values_list("event_id", flat=True)
    )
    if not user_attended:
        return []

    all_users = User.objects.exclude(id=user.id)
    similarities = []
    for other in all_users:
        other_attended = set(
            Ticket.objects.filter(user=other, is_used=True).values_list("event_id", flat=True)
        )
        if not other_attended:
            continue
        intersection = len(user_attended & other_attended)
        union = len(user_attended | other_attended)
        jaccard = intersection / union if union else 0.0
        similarities.append((jaccard, other.id))

    similarities.sort(reverse=True)
    top_similar_user_ids = [uid for _, uid in similarities[:10]]

    candidate_event_ids = set(
        Ticket.objects.filter(
            user_id__in=top_similar_user_ids, is_used=True
        ).values_list("event_id", flat=True)
    ) - user_attended

    return list(
        Event.objects.filter(id__in=candidate_event_ids, status="published")
        .order_by("-date")[:limit]
    )
