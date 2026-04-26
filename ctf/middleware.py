from ipware import get_client_ip

class RealIPMiddleware:
    """
    Middleware that resolves the actual client IP from reverse proxies (like Cloudflare, Nginx)
    using django-ipware, and overwrites request.META['REMOTE_ADDR'].
    
    This ensures that any subsequent middleware or libraries (like django-ratelimit)
    that rely on REMOTE_ADDR will use the true client IP instead of the proxy's IP.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        client_ip, is_routable = get_client_ip(request)
        if client_ip:
            request.META['REMOTE_ADDR'] = client_ip
            
        return self.get_response(request)
