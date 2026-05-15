# Observability — 100% Coverage Required

> **Source of Truth:** This skill defines ALL observability rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 10.1 The Golden Rule

- **Logs + Traces + Metrics:** Required for EVERY operation. NO EXCEPTIONS.
- **Events Table:** ONLY for data where the business needs a permanent audit trail (Golden Question: "Would the business/user care about this record in a year?"). Technical events (login, refresh, API errors) go to logs only — NEVER to events table.

### Decision Matrix

| Question | Logs | Traces | Metrics | Events Table |
|----------|:----:|:------:|:-------:|:------------:|
| Is this a code operation? | ✅ Always | ✅ Always | ✅ Always | - |
| Would a user/business care in a year? | ✅ Always | ✅ Always | ✅ Always | ✅ ALSO |

### Examples

| Operation | Events Table? | Why |
|-----------|:------------:|-----|
| User registers | ✅ YES | Business needs to know who signed up, when, and how. Audit. |
| User logs in | ❌ NO | High volume, session-level. No business value to persist forever. Logs cover security. |
| Order placed | ✅ YES | Transaction record. Customer and business need this permanently. |
| Token refreshed | ❌ NO | Session management → logs only. |
| Role changed to admin | ✅ YES | Security audit. Must be permanently queryable. |
| API request timed out | ❌ NO | Technical diagnostic data → logs/traces/metrics only. |
| Subscription cancelled | ✅ YES | Business-critical. Customer needs to see this in billing history. |
| Background job ran | ❌ NO | Technical → logs/traces/metrics. |
| Payment failed | ✅ YES | Business + customer need to know. Permanent record for support. |
| Password reset | ❌ NO | Covered by logs. Events table would add noise. |

---

## Stack

- **Logging** (`structlog`): EVERY operation → stdout (JSON in production, pretty in dev)
- **Tracing** (`OpenTelemetry`): EVERY async function → OTEL collector (Grafana Tempo, Jaeger, SigNoz)
- **Metrics** (`Prometheus`): EVERY HTTP request + DB query → `GET /metrics`
- **Events Table** (PostgreSQL): ONLY when Golden Question = YES

---

## 10.3 Logging (structlog)

- ALL requests MUST be logged with: method, path, status, duration_ms, client_ip, request_id.
- Health check, metrics, and docs endpoints MUST NOT be logged (noise reduction).
- All logs MUST be structured JSON in production (`JSONRenderer`), pretty console in dev (`ConsoleRenderer`).
- **PII MUST NEVER appear in logs.** The `redact_pii` processor redacts keys in `SENSITIVE_KEYS`: `password`, `token`, `secret`, `ssn`, `credit_card`, `refresh_token`, `access_token`, `authorization`, `api_key`, `private_key`, `secret_key`.
- Every log line MUST include `request_id` and `trace_id` for correlation (via `structlog.contextvars`).
- Log levels: `INFO` for normal operations, `WARNING` for suspicious/failed attempts, `ERROR` for exceptions.
- Log format in dev: `ConsoleRenderer`. In production: `JSONRenderer`.

---

## 10.4 Tracing (OpenTelemetry)

- Every boundary-crossing method MUST have `@async_trace` with a descriptive span name (e.g., `"auth_service.register"`, `"orm.postgres.find_by"`, `"event_service.record"`).
- Spans MUST include business context attributes (user_id, entity_id, etc.) via `attributes` parameter.
- `UserIDSpanProcessor` MUST attach `enduser.id` and `actor_id` to every span from context variable.
- Trace sampling: 100% in development, 10% in production (via `ParentBasedSampler(TraceIdRatioBased(0.1))`).
- Trace context MUST propagate to downstream services via HTTP headers.
- Every span MUST record: start time, duration, status (OK/ERROR), and exception details on failure (`span.record_exception(e)`).
- `@observe_db` decorator MUST use actual table name in labels — NEVER hardcode `"dynamic"`.

---

## 10.5 Metrics (Prometheus)

- Every HTTP request increments `http_requests_total` (labels: method, endpoint, status_code).
- Every HTTP request records `http_request_duration_seconds` (labels: method, endpoint).
- Every DB query increments `db_queries_total` (labels: operation, actual table name).
- Every DB query records `db_query_duration_seconds` (labels: operation, actual table name).
- `auth_failures_total` (labels: reason) tracks authentication failures (invalid token, expired token, insufficient permissions, account locked, etc.).
- Histogram buckets MUST be tuned for the service's typical latencies (not Prometheus defaults).
- `/metrics` endpoint is mounted via `make_asgi_app()` and MUST be protected by authentication or IP whitelist in production.
- Slow query logging: log warning for DB queries exceeding 1000ms.

---

## 10.6 Events Table

- Events table is ONLY for data that passes the Golden Question.
- Service code writes to events table via `event_service.record()`. Middleware MUST NOT.
- Every event record MUST include: `event_type` (dot-notation, e.g., `"auth.register"`), `entity_type`, `entity_id`, `metadata` (JSONB), `severity` (default `"info"`).
- Use `@async_trace("event_service.record")` decorator on all event recording methods.

---

## 10.7 Context Variables

- `request_id_var` — Unique request identifier (UUID). Set by `ObservabilityMiddleware`.
- `trace_id_var` — Trace correlation ID (first 8 chars of request_id).
- `user_id_var` — Authenticated user ID. Set by `get_current_user` dependency.
- All three MUST be bound to `structlog.contextvars` for automatic inclusion in every log line.

---

## How to Add Observability — The Complete Pattern

```python
from app.core.observability import logger, async_trace, observe_db
from app.services.event_service import event_service

class SomeService:
    @async_trace("service.some_operation")           # ← TRACING (always)
    async def some_operation(self, user_id: str):
        logger.info("some_operation.started", user_id=user_id)  # ← LOGGING (always)

        # ... business logic ...

        logger.info("some_operation.completed", user_id=user_id)

        # ⭐ Only if Golden Question = YES:
        await event_service.record(
            event_type="some.business.event",
            entity_type="something",
            entity_id=result_id,
            metadata={"user_id": user_id},
        )

        return result
```

---

## Hard Rules

### Logging
- ALL requests MUST be logged with: method, path, status, duration_ms, client_ip, request_id.
- Health check and metrics endpoints MUST NOT be logged (noise reduction).
- All logs MUST be structured JSON (`structlog` with `JSONRenderer` in production).
- **PII MUST NEVER appear in logs.** Emails, IPs, full names MUST be redacted, hashed, or masked.
- Every log line MUST include `request_id` and `trace_id` for correlation.

### Metrics
- Every HTTP request MUST increment `http_requests_total` (labels: method, endpoint, status).
- Every HTTP request MUST record `http_request_duration_seconds` (labels: method, endpoint).
- Every DB query MUST increment `db_queries_total` (labels: operation, **actual table name**).
- Every DB query MUST record `db_query_duration_seconds` (labels: operation, **actual table name**).
- Business metrics MUST be added: registrations, logins, role changes, event counts.
- `auth_failures_total` MUST be incremented on ALL auth/authz failures (bad tokens, insufficient permissions, account lockout, rate limit exceeded).
- Histogram buckets MUST be tuned for your service's typical latencies (not Prometheus defaults).
- The `/metrics` endpoint MUST be protected by authentication or IP whitelist.

### Tracing
- Every boundary-crossing method MUST have `@async_trace` with a descriptive span name.
- Spans MUST include business context attributes (user_id, entity_id, etc.).
- Trace sampling: 100% in development, 10% in production (with ability to increase on demand).
- Trace context MUST propagate to downstream services via HTTP headers.
- Every span MUST record: start time, duration, status (OK/ERROR), and exception details on failure.
- `@observe_db` MUST use the actual table name — NEVER hardcode `"dynamic"` as the table label.

### Events Table
- Events table is ONLY for data that passes the Golden Question (business/user needs in a year).
- Technical operations (login, refresh, API calls, background jobs) MUST NOT write to events table.
- Service code writes to events table. Middleware MUST NOT.

### Notifications on State Changes
- Any service operation that changes ownership/assignment of a resource to a user (e.g., assigning a complaint to a technician) MUST create a notification for that user via `notification_service.create()`.
- The notification MUST include: meaningful `title` (e.g., "New complaint assigned"), descriptive `body`, `type="assignment"`, and the target `user_id`.
- This logic MUST live in the service layer (not the route) so it fires regardless of how the update is triggered.
- Failed notification creation MUST NOT block the primary operation (wrap in try/except with error logging).

### Middleware (observability-related)
- `SecurityHeadersMiddleware`: Security headers on every response, never writes DB.
- `ObservabilityMiddleware`: Prometheus metrics, trace context, X-Request-ID, never writes DB.
- `RequestLoggingMiddleware`: Structured logging of request/response cycles, never writes DB.

---

## Configuration

```env
OTEL_ENDPOINT=http://localhost:4318/v1/traces
LOG_LEVEL=INFO
ENABLE_METRICS=true
ENABLE_TRACING=true
```
