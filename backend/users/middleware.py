from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse

class BlockedUserMiddleware(MiddlewareMixin):
    
    def process_request(self, request):
        skip_paths = [
            '/api/users/login/',
            '/api/users/register/',
            '/api/users/google/',
            '/api/token/refresh/',
            '/admin/', 
        ]
        
        if any(request.path.startswith(path) for path in skip_paths):
            return None
        
        if hasattr(request, 'user') and request.user.is_authenticated:
            if not request.user.is_active:
                return JsonResponse(
                    {
                        "error": "Your account has been suspended. Please contact support.",
                        "blocked": True,
                        "logout": True
                    },
                    status=403
                )
        
        return None