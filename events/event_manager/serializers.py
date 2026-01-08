from rest_framework import serializers
from .models import User, Event, EventInterest, EventExperience

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'user_type']
        read_only_fields = ['id']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'user_type']
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=validated_data.get('user_type', 'user')
        )
        return user

class EventSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    interested_count = serializers.SerializerMethodField()
    interested_count= serializers.IntegerField(read_only=True)
    is_interested = serializers.SerializerMethodField()
    creator_name= serializers.ReadOnlyField(source='created_by.username')
    has_posted_experience = serializers.SerializerMethodField()
    

    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'date', 'location', 'end_date', 'creator_name', 'created_by', 'created_at', 'interested_count', 'is_interested', 'has_posted_experience']
        read_only_fields = ['id', 'created_at', 'created_by']
    
    def get_interested_count(self, obj):
        return EventInterest.objects.filter(event=obj).count()
    
    def get_is_interested(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return EventInterest.objects.filter(user=request.user, event=obj).exists()
        return False
    
    def get_has_posted_experience(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return EventExperience.objects.filter(event=obj, user=user).exists()
        return False

class EventInterestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    event = EventSerializer(read_only=True)
    
    class Meta:
        model = EventInterest
        fields = ['id', 'user', 'event', 'interested_at']
        read_only_fields = ['id', 'interested_at']

class EventExperienceSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_name = serializers.ReadOnlyField(source='user.username')
    replies = serializers.SerializerMethodField()

    class Meta:
        model = EventExperience
        fields = ['id', 'user', 'username', 'event', 'description', 'image', 'created_at', 'user_name', 'replies', 'parent']
        read_only_fields = ['user', 'created_at']
    
    def get_replies(self, obj):
        # This gets the children of the current comment
        if obj.replies.exists():
            return EventExperienceSerializer(obj.replies.all(), many=True, context=self.context).data
        return []