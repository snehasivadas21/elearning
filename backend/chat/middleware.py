import urllib.parse
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async

User = get_user_model()

class TokenAuthMiddleware:
    """
    ASGI middleware that attaches `scope['user']` based on:
      1) query string `?token=...`
      2) Authorization header "Bearer <token>"
    Falls back to AnonymousUser — note AuthMiddlewareStack can still be used
    to enable session/cookie auth as well.
    """
    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return TokenAuthMiddlewareInstance(scope, self.inner)


class TokenAuthMiddlewareInstance:
    def __init__(self, scope, inner):
        self.scope = dict(scope)
        self.inner = inner

    async def __call__(self, receive, send):
        token = None
        # 1) try query string
        qs = self.scope.get("query_string", b"").decode()
        if qs:
            params = urllib.parse.parse_qs(qs)
            if "token" in params:
                token = params["token"][0]

        # 2) try Authorization header
        if not token:
            headers = {k.decode(): v.decode() for k, v in self.scope.get("headers", [])}
            auth = headers.get("authorization") or headers.get("Authorization")
            if auth and auth.lower().startswith("bearer "):
                token = auth.split(" ", 1)[1]

        user = await self.get_user_from_token(token) if token else AnonymousUser()
        self.scope["user"] = user

        inner = self.inner(self.scope)
        return await inner(receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        # Try DRF Token first
        try:
            from rest_framework.authtoken.models import Token as DRFToken
            t = DRFToken.objects.select_related("user").get(key=token)
            return t.user
        except Exception:
            pass

        # Try SimpleJWT
        try:
            from rest_framework_simplejwt.backends import TokenBackend
            from django.conf import settings
            backend = TokenBackend(algorithm=getattr(settings, "SIMPLE_JWT", {}).get("ALGORITHM", "HS256"),
                                   signing_key=settings.SECRET_KEY)
            data = backend.decode(token, verify=True)
            user_id = data.get("user_id") or data.get("user")
            if user_id:
                return User.objects.get(id=user_id)
        except Exception:
            pass

        return AnonymousUser()
