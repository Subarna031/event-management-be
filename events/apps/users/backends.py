"""
Custom JWT authentication backend.

Embeds a short fingerprint of the user's current password hash inside
every issued token. If the user changes their password the fingerprint
stored in already-issued tokens will no longer match, making those tokens
invalid even before they expire.
"""
import hashlib

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.backends import TokenBackend
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken


def password_fingerprint(user) -> str:
    """First 12 hex chars of SHA-256(password_hash). Cheap and non-reversible."""
    return hashlib.sha256(user.password.encode()).hexdigest()[:12]


class PasswordAwareRefreshToken(RefreshToken):
    """
    Injects `pw_hash` claim at issue time so any token issued before a
    password change becomes invalid once the user's hash differs.
    """

    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)
        token["pw_hash"] = password_fingerprint(user)
        return token


class PasswordAwareAuthentication(JWTAuthentication):
    """
    Extends SimpleJWT's authentication to reject access tokens whose
    embedded `pw_hash` claim no longer matches the user's current password.
    """

    def get_validated_token(self, raw_token):
        validated = super().get_validated_token(raw_token)
        return validated

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        stored_hash = validated_token.get("pw_hash")
        if stored_hash is not None:
            if stored_hash != password_fingerprint(user):
                raise InvalidToken(
                    "Token is no longer valid — password was changed."
                )
        return user
