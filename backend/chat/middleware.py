import urllib.parse
from channels.db import database_sync_to_async

class TokenAuthMiddleware:
    """
    ASGI middleware that attaches `scope['user']` based on:
      1) query string ?token=...
      2) Authorization header "Bearer <token>"
    Falls back to AnonymousUser if invalid.
    """

    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return TokenAuthMiddlewareInstance(scope, self.inner)


class TokenAuthMiddlewareInstance:
    def __init__(self, scope, inner):
        self.scope = scope
        self.inner = inner

    async def __call__(self, receive, send):
        token = None

        # 1) Query string
        qs = self.scope.get("query_string", b"")
        if isinstance(qs, bytes):
            qs = qs.decode()
        params = urllib.parse.parse_qs(qs)
        if "token" in params:
            token = params["token"][0]

        # 2) Authorization header
        if not token:
            headers = {
                k.decode() if isinstance(k, bytes) else k:
                v.decode() if isinstance(v, bytes) else v
                for k, v in self.scope.get("headers", [])
            }
            auth = headers.get("authorization") or headers.get("Authorization")
            if auth and auth.lower().startswith("bearer "):
                token = auth.split(" ", 1)[1]

        # Resolve user
        user = await self.get_user_from_token(token) if token else self.get_anonymous_user()
        self.scope["user"] = user

        inner = self.inner(self.scope)
        return await inner(receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        """
        Try DRF Token first, then SimpleJWT.
        Returns a user or AnonymousUser.
        """
        from django.contrib.auth import get_user_model
        from django.contrib.auth.models import AnonymousUser

        User = get_user_model()

        # --- DRF Token ---
        try:
            from rest_framework.authtoken.models import Token as DRFToken
            t = DRFToken.objects.select_related("user").get(key=token)
            return t.user
        except Exception:
            pass

        # --- SimpleJWT ---
        try:
            from rest_framework_simplejwt.backends import TokenBackend
            from django.conf import settings

            algorithm = getattr(settings, "SIMPLE_JWT", {}).get("ALGORITHM", "HS256")
            backend = TokenBackend(
                algorithm=algorithm,
                signing_key=settings.SECRET_KEY
            )
            data = backend.decode(token, verify=True)
            user_id = data.get("user_id") or data.get("user")
            if user_id:
                return User.objects.get(id=user_id)
        except Exception:
            pass

        return AnonymousUser()

    def get_anonymous_user(self):
        """Safe import for AnonymousUser."""
        from django.contrib.auth.models import AnonymousUser
        return AnonymousUser()
