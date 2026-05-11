from rest_framework import permissions


class IsOrganizer(permissions.BasePermission):
    """Allows access only to users with the organizer role."""

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "organizer"
        )


class IsParticipant(permissions.BasePermission):
    """Allows access only to users with the participant role."""

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "participant"
        )


class IsEventOwner(permissions.BasePermission):
    """Object-level permission: only the event organizer may modify it."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.organizer == request.user


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object-level permission: owner can write, others can read."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user
