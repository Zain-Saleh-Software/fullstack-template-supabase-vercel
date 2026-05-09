from fastapi import Request
from slowapi import Limiter


def _get_client_ip(request: Request) -> str:
    """Extract client IP from X-Forwarded-For or fall back to direct connection.
    
    Supports reverse proxy setups (Nginx, Cloudflare, ALB) by checking
    X-Forwarded-For first. The proxy MUST be configured to set/override
    this header to prevent spoofing.
    """
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded and "," in forwarded:
        return forwarded.split(",")[0].strip()
    if forwarded:
        return forwarded.strip()
    client = getattr(request, "client", None)
    if client:
        return client.host or "unknown"
    return "unknown"


limiter = Limiter(key_func=_get_client_ip)
