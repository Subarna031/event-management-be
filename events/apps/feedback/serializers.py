from rest_framework import serializers
from .models import Feedback, FeedbackImage
from apps.users.serializers import UserSerializer


class FeedbackImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackImage
        fields = ["id", "image", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class FeedbackSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source="user", read_only=True)
    images = FeedbackImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model = Feedback
        fields = [
            "id", "user", "user_detail", "event", "rating", "comment",
            "images", "uploaded_images", "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]

    def create(self, validated_data):
        uploaded_images = validated_data.pop("uploaded_images", [])
        feedback = Feedback.objects.create(**validated_data)
        for img in uploaded_images:
            FeedbackImage.objects.create(feedback=feedback, image=img)
        return feedback


class FeedbackSummarySerializer(serializers.Serializer):
    """Aggregate stats for an event's feedback."""
    avg_rating = serializers.FloatField()
    total_reviews = serializers.IntegerField()
    rating_distribution = serializers.DictField(child=serializers.IntegerField())
