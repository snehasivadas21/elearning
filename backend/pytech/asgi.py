"""
ASGI config for pytech project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""


import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from chat.middleware import JWTAuthMiddleware

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pytech.settings")

import chat.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        URLRouter(chat.routing.websocket_urlpatterns)
    ),
})

