"""
Event Tracing Middleware — TECHNICAL OBSERVABILITY ONLY.

This middleware does NOT write to the database events table.
It logs request/response cycles to the structured logging system (structlog)
for diagnostics, debugging, and monitoring.

Business events that must persist are recorded explicitly in service code
via EventService.record(). See observability-patterns.md for the boundary.
"""

import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.observability import get_request_id, logger

EXCLUDED_PATHS = {"/api/v1/health", "/metrics", "/docs", "/redoc", "/openapi.json"}


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs all request/response cycles for technical observability.

    - Writes to STRUCTURED LOGS (not the events table)
    - Captures: method, path, status, duration, client_ip, request_id
    - Excluded paths skip logging to reduce noise
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        start = time.time()
        rid = get_request_id()

        try:
            response: Response = await call_next(request)
            duration_ms = round((time.time() - start) * 1000, 2)

            if request.url.path not in EXCLUDED_PATHS:
                client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else None)
                if client_ip and "," in client_ip:
                    client_ip = client_ip.split(",")[0].strip()
                logger.info(
                    "request_cycle",
                    method=request.method,
                    path=request.url.path,
                    status=response.status_code,
                    duration_ms=duration_ms,
                    client_ip=client_ip,
                    request_id=rid,
                )

            return response

        except Exception as exc:
            duration_ms = round((time.time() - start) * 1000, 2)
            logger.error(
                "request_cycle_error",
                method=request.method,
                path=request.url.path,
                duration_ms=duration_ms,
                error=str(exc),
                request_id=rid,
            )
            raise
