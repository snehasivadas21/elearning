from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from django.db import close_old_connections


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        close_old_connections()

        from django.contrib.auth.models import AnonymousUser
        from rest_framework_simplejwt.authentication import JWTAuthentication

        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token")

        if token:
            try:
                validated = JWTAuthentication().get_validated_token(token[0])
                user = JWTAuthentication().get_user(validated)
                scope["user"] = user
            except Exception:
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)
