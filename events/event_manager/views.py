from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from .models import User, Event, EventInterest, EventExperience
from .serializers import UserSerializer, RegisterSerializer, EventSerializer, EventInterestSerializer, EventExperienceSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.db.models import Count
from django.core.mail import send_mail
from django.conf import settings

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, views):
        return request.user and request.user.is_authenticated and request.user.user_type== 'admin'

class RegisterView(APIView):
    permission_classes= [permissions.AllowAny]

    def post(self, request):
        serializer= RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user= serializer.save()
            refresh= RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status= status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes= [permissions.AllowAny]

    def post(self, request):
        username= request.data.get('username')
        password= request.data.get('password')
        user= authenticate(username=username, password=password)

        if user:
            refresh= RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status= status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class EventViewSet(viewsets.ModelViewSet):
    queryset= Event.objects.all()
    serializer_class= EventSerializer
    permission_classes= [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def interested(self, request, pk=None):
        event= self.get_object()
        user= request.user

        if user.user_type == 'admin':
            return Response({'error': 'Admins cannot express interest in events'}, status=status.HTTP_400_BAD_REQUEST)
        interest, created= EventInterest.objects.get_or_create(user=user, event=event)

        if not created:
            interest.delete()
            return Response({'message': 'Interest removed', 'is_interested': False}, status=status.HTTP_201_CREATED)
        return Response({'message': 'Interest added', 'is_interested': True}, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def interested_users(self, request, pk=None):
        if request.user.user_type != 'admin':
            return Response({'error': 'Only admin can view interested users'}, status= status.HTTP_403_FORBIDDEN)
        event= self.get_object()
        interests = EventInterest.objects.filter(event=event)
        serializer= EventInterestSerializer(interests, many=True, context={"request": request})
        return Response(serializer.data)

    def get_queryset(self):
        queryset= Event.objects.annotate(interested_count= Count('event_interests'))
        sort_by= self.request.query_params.get('sort')
        if sort_by== 'most_interested':
            return queryset.order_by('-interested_count')
        elif sort_by=='newest':
            return queryset.order_by('created_at')
        elif sort_by== 'date':
            return queryset.order_by('date')
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail= True, methods=['post'], url_path='send_notification')
    def send_notification(self, request, pk=None):
        event= self.get_object()
        subject= request.data.get('subject')
        base_message= request.data.get('message')

        if not subject or not base_message:
            return Response({'error': 'Subject and Message are required'}, status=400)
        
        interests= event.event_interests.select_related('user').all()

        email_sent_count= 0
        for interest in interests:
            user= interest.user
            if user.email:
                personalized_message= f"Hello {user.username},\n\n{base_message}\n\nRegards,\nEvent Management Team"
                try:
                    send_mail(
                        subject= f"Update Regarding: {event.title}- {subject}",
                        message= personalized_message,
                        from_email= settings.EMAIL_HOST_USER if hasattr(settings, 'EMAIL_HOST_USER') else 'admin@events.com',
                        recipient_list= [user.email],
                        fail_silently= False,
                    )
                    email_sent_count +=1
                except Exception as e:
                    print(f"Failed to send email to {user.email}: {e}")
        return Response({'status': 'success', 'count':email_sent_count})
    
    # for admin analytics
    @action(detail=False, methods=['get'])
    def stats(self, request):
        try:
            total_users = User.objects.count()
            total_events = Event.objects.count()
            total_interests = EventInterest.objects.count()

            return Response({
                "total_users": total_users,
                "total_events": total_events,
                "total_interests": total_interests
            })
            
        except Exception as e:
            print(f"Error generating stats: {e}")
            return Response({
                "total_users": 0, 
                "total_events": 0, 
                "total_interests": 0 
            })

# class ExperienceViewSet(viewsets.ModelViewSet):
#     queryset = EventExperience.objects.all()
#     serializer_class = EventExperienceSerializer
#     permission_classes = [permissions.IsAuthenticatedOrReadOnly]

#     def perform_create(self, serializer):
#         serializer.save(user=self.request.user)
    
#     @api_view(['GET'])
#     def get_event_experiences(request, event_id):
#         experiences = EventExperience.objects.filter(event_id=event_id).order_by('-created_at')
#         serializer = EventExperienceSerializer(experiences, many=True)
#         return Response(serializer.data)

class ExperienceViewSet(viewsets.ModelViewSet):
    queryset = EventExperience.objects.all()
    serializer_class = EventExperienceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='event/(?P<event_id>[^/.]+)')
    def get_event_experiences(self, request, event_id=None):
        experiences = EventExperience.objects.filter(event_id=event_id).order_by('-created_at')
        serializer = EventExperienceSerializer(experiences, many=True)
        return Response(serializer.data)
