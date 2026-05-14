import functools
import time
import uuid
from contextvars import ContextVar
from typing import Any, Callable, Optional

import structlog
from prometheus_client import Counter, Histogram

from app.core.config import settings

request_id_var: ContextVar[str] = ContextVar("request_id", default="")
trace_id_var: ContextVar[str] = ContextVar("trace_id", default="")
user_id_var: ContextVar[Optional[str]] = ContextVar("user_id", default=None)

SENSITIVE_KEYS = frozenset({
    "password", "token", "secret", "ssn", "credit_card",
    "refresh_token", "access_token", "authorization", "api_key",
    "private_key", "secret_key",
})


def redact_pii(logger: structlog.stdlib.BoundLogger, method_name: str, event_dict: dict) -> dict:
    def _redact(obj):
        if isinstance(obj, dict):
            return {
                k: "[REDACTED]" if isinstance(k, str) and k.lower() in SENSITIVE_KEYS else _redact(v)
                for k, v in obj.items()
            }
        if isinstance(obj, list):
            return [_redact(item) for item in obj]
        return obj
    return _redact(event_dict)


structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        redact_pii,
        structlog.dev.ConsoleRenderer() if settings.debug
        else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger("fullstack")

http_request_count = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

http_request_duration = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
)

db_query_count = Counter(
    "db_queries_total",
    "Total database queries",
    ["operation", "table"],
)

db_query_duration = Histogram(
    "db_query_duration_seconds",
    "Database query duration in seconds",
    ["operation", "table"],
)

auth_failures_total = Counter(
    "auth_failures_total",
    "Total authentication failures",
    ["reason"],
)


def async_trace(span_name: str, attributes: Optional[dict] = None):
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                raise
            finally:
                duration = time.time() - start
                logger.debug("trace", span=span_name, duration_ms=round(duration * 1000, 2))
        return async_wrapper
    return decorator


def observe_db(operation: str, table: str):
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            actual_table = table
            if actual_table == "dynamic":
                if len(args) > 1 and hasattr(args[1], "_table"):
                    actual_table = args[1]._table()
                elif "model_class" in kwargs and hasattr(kwargs["model_class"], "_table"):
                    actual_table = kwargs["model_class"]._table()
                else:
                    actual_table = "raw_or_unknown"

            db_query_count.labels(operation=operation, table=actual_table).inc()
            start = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start
                db_query_duration.labels(operation=operation, table=actual_table).observe(duration)
                if duration > 1.0:
                    logger.warning("slow_query", operation=operation, table=actual_table, duration_ms=round(duration * 1000, 2))
        return wrapper
    return decorator


def get_request_id() -> str:
    return request_id_var.get()


def set_request_id(rid: str):
    request_id_var.set(rid)


def set_trace_context(rid: str, uid: Optional[str] = None):
    request_id_var.set(rid)
    if uid:
        user_id_var.set(uid)
    trace_id_var.set(rid[:8])
    structlog.contextvars.bind_contextvars(
        request_id=rid,
        trace_id=rid[:8],
        user_id=uid,
    )
