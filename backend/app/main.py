from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from prometheus_client import make_asgi_app
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.observability import setup_tracing, logger
from app.core.rate_limit import limiter
from app.core.token_blacklist import token_blacklist
from app.orm import close_orm
from app.middleware.observability_middleware import ObservabilityMiddleware
from app.middleware.request_logging_middleware import RequestLoggingMiddleware
from app.api.v1 import auth_router, users_router, health_router, roles_router, events_router, changes_router

# ─── Sentry (optional) ───────────────────────────────────────────────────
if settings.sentry_dsn:
    import sentry_sdk
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=0.1,
        send_default_pii=False,
    )
    logger.info("sentry_initialized")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.enable_tracing:
        setup_tracing()
        logger.info("tracing_initialized")
    logger.info("app_starting", app=settings.app_name, version=settings.app_version)
    yield
    await close_orm()
    await token_blacklist.close()
    logger.info("app_shutdown")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    from fastapi.responses import JSONResponse
    from fastapi import HTTPException
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": "HTTP_ERROR", "message": exc.detail}},
        )
    logger.exception("unhandled_error", path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}},
    )

# ─── Security Headers ────────────────────────────────────────────────────
# Note: CSRF protection is inherently handled by Bearer token auth
# (tokens in Authorization header, not cookies). No cookie-based sessions
# means no CSRF vulnerability for API endpoints.


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if settings.environment == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # CSP: restrictive but allows fonts, styles, scripts, and API connections needed at runtime.
    # We include Swagger UI sources (jsdelivr and fastapi.tiangolo.com) to allow docs to load.
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https://fastapi.tiangolo.com; "
        "connect-src 'self' https://cdn.jsdelivr.net https://*.supabase.co; "
        "frame-ancestors 'none'"
    )
    response.headers["Content-Security-Policy"] = csp
    return response


# ─── Middleware (reverse order: last added runs first) ───────────────────


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10 * 1024 * 1024:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=413,
            content={"error": {"code": "PAYLOAD_TOO_LARGE", "message": "Request body too large"}},
        )
    return await call_next(request)


@app.middleware("http")
async def validate_content_type(request: Request, call_next):
    if request.method in ("POST", "PATCH", "PUT"):
        content_type = request.headers.get("content-type", "")
        # Allow multipart/form-data for file uploads if needed, otherwise enforce json
        if not content_type.startswith("application/json") and not content_type.startswith("multipart/form-data"):
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=415,
                content={"error": {"code": "UNSUPPORTED_MEDIA_TYPE", "message": "Content-Type must be application/json"}},
            )
    return await call_next(request)


@app.middleware("http")
async def validate_host(request: Request, call_next):
    host = request.headers.get("host", "")
    allowed = settings.allowed_hosts_list
    if allowed and host not in allowed and host.split(":")[0] not in allowed:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "INVALID_HOST", "message": "Invalid host header"}},
        )
    return await call_next(request)


app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(ObservabilityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ──────────────────────────────────────────────────────────────
app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(roles_router, prefix="/api/v1")
app.include_router(events_router, prefix="/api/v1")
app.include_router(changes_router, prefix="/api/v1")


# ─── Browser/DevTools Noise Suppression ──────────────────────────────────
@app.get("/.well-known/appspecific/com.chrome.devtools.json", include_in_schema=False)
async def devtools_json():
    """Silently handle Chrome DevTools requests to keep logs clean."""
    return {}


# ─── Metrics ─────────────────────────────────────────────────────────────
if settings.enable_metrics:
    app.mount("/metrics", make_asgi_app())
