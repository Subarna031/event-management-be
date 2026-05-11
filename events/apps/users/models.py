from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.postgres.fields import ArrayField
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("organizer", "Organizer"),
        ("participant", "Participant"),
    )

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default="participant")
    profile_image = models.ImageField(upload_to="profiles/", null=True, blank=True)
    bio = models.TextField(blank=True)
    interests = ArrayField(
        models.CharField(max_length=50), blank=True, default=list
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        app_label = "users"

    def __str__(self):
        return self.email

    @property
    def is_organizer(self):
        return self.role == "organizer"

    @property
    def is_participant(self):
        return self.role == "participant"
