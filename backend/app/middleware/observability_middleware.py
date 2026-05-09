"""
Observability Middleware — METRICS & TRACING ONLY (no DB writes).

Responsibilities:
  - Set trace context (request_id, trace_id) per request
  - Record Prometheus HTTP metrics (count, duration)
  - Attach X-Request-ID to every response

Logging is handled by RequestLoggingMiddleware separately.
Events table writes are done explicitly in service code.
"""

import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.observability import (
    http_request_count,
    http_request_duration,
    set_trace_context,
)


class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = str(uuid.uuid4())
        set_trace_context(rid)
        start = time.time()
        status_code = 500

        try:
            response: Response = await call_next(request)
            status_code = response.status_code
            response.headers["X-Request-ID"] = rid
            return response

        except Exception as exc:
            status_code = getattr(exc, "status_code", 500)
            raise

        finally:
            duration = time.time() - start
            self._record_metrics(request.method, request.url.path, status_code, duration)

    def _record_metrics(self, method: str, path: str, status_code: int, duration: float):
        http_request_count.labels(
            method=method,
            endpoint=path,
            status=status_code,
        ).inc()
        http_request_duration.labels(
            method=method,
            endpoint=path,
        ).observe(duration)
