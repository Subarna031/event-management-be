from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    USER_TYPE_CHOICES=(
        ('admin','Admin'),
        ('user','User'),
    )
    user_type=models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='user')

    def __str__(self):
        return self.username

class Event(models.Model):
    title= models.CharField(max_length=100)
    description= models.TextField()
    date= models.DateTimeField()
    end_date= models.DateTimeField(null=True, blank=True)
    location= models.CharField(max_length=60)
    created_by= models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_events")
    created_at= models.DateTimeField(auto_now_add=True)
    updated_at= models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    
    class Meta:
        ordering= ['-date']

class EventExperience(models.Model):
    user= models.ForeignKey(User, on_delete=models.CASCADE)
    event= models.ForeignKey(Event, on_delete=models.CASCADE, related_name="experiences")
    description= models.TextField()
    image= models.ImageField(upload_to="experiences_images/", blank= True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='replies', on_delete=models.CASCADE)

    def __str__(self):
        return f"Experience by {self.user.username} on {self.event.title}"


class EventInterest(models.Model):
    user= models.ForeignKey(User, on_delete=models.CASCADE, related_name="event_interests")
    event= models.ForeignKey(Event, on_delete=models.CASCADE, related_name="event_interests")
    interested_at= models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together= ('user', 'event')
        ordering= ['-interested_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.event.title}"
