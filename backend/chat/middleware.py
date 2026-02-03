from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.conf import settings
from urllib.parse import parse_qs
import jwt
import logging

logger = logging.getLogger(__name__)


class JWTAuthMiddleware(BaseMiddleware):

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        scope["user"] = await self.get_user_from_token(token)

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        from django.contrib.auth import get_user_model
        from django.contrib.auth.models import AnonymousUser

        if not token:
            return AnonymousUser()

        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
            )
            User = get_user_model()
            return User.objects.get(id=payload["user_id"])
        except Exception as e:
            logger.warning(f"WS auth failed: {e}")
            return AnonymousUser()
