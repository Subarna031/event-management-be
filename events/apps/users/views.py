from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.exceptions import TokenError

from .backends import PasswordAwareRefreshToken
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


def _token_pair(user: User) -> dict:
    """Issue an access/refresh pair using the password-aware token class."""
    refresh = PasswordAwareRefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": UserSerializer(user).data, **_token_pair(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if not user:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {"error": "This account has been deactivated."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({"user": UserSerializer(user).data, **_token_pair(user)})


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = PasswordAwareRefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except (KeyError, TokenError):
            return Response(
                {"error": "Invalid or missing refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MeView(generics.RetrieveAPIView):
    """Return the authenticated user's own profile (used for session validation)."""
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileUpdateSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        return Response(UserSerializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(instance).data)


class ChangePasswordView(APIView):
    """
    Changes the user's password, blacklists the submitted refresh token, and
    issues a brand-new pair so the client stays logged in without manual re-login.
    Old tokens are automatically rejected by PasswordAwareAuthentication because
    their embedded pw_hash no longer matches.
    """

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Blacklist the current refresh token before changing the password
        try:
            old_refresh = request.data.get("refresh")
            if old_refresh:
                PasswordAwareRefreshToken(old_refresh).blacklist()
        except TokenError:
            pass  # non-fatal — pw_hash mismatch will still kill old tokens

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        # Issue new pair with the updated pw_hash fingerprint
        return Response(
            {
                "message": "Password updated successfully.",
                **_token_pair(user),
            }
        )


class UserListView(generics.ListAPIView):
    """Admin-only: list all users."""
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
