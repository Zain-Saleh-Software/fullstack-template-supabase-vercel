# Observability Patterns — 100% Coverage Required

> **MANDATORY:** ALL rules in `RULES.md` apply. This skill supplements, never overrides, `RULES.md`.
> Every PR, commit, and deployment MUST comply with `RULES.md`. Deviations require an ADR.

## Golden Rule

```
EVERY operation gets logs + traces + metrics. ALWAYS. NO EXCEPTIONS.

Then ask: "Does the end-user or the business need to see this record in a year?"
  YES → Events Table ALSO gets a record (in addition to logs/traces/metrics)
  NO  → Events Table does NOT get a record
```

### Decision Matrix

| Question | Logs | Traces | Metrics | Events Table |
|----------|:----:|:------:|:-------:|:------------:|
| Is this a code operation? | ✅ YES | ✅ YES | ✅ YES | - |
| Would a user/business care in a year? | ✅ YES | ✅ YES | ✅ YES | ✅ YES ALSO |

**Logs + Traces + Metrics are non-optional.** They exist for every operation.
The only question is whether the **events table** also gets a copy.

### Examples

| Operation | Events Table? | Why |
|-----------|:------------:|-----|
| User registers | ✅ YES | Business needs to know who signed up, when, and how. Audit. |
| User logs in | ❌ NO | High volume, session-level. No business value to persist forever. Logs cover security. |
| Order placed | ✅ YES | Transaction record. Customer and business need this permanently. |
| API request timed out | ❌ NO | Technical diagnostic data → logs/traces/metrics only. |
| Role changed to admin | ✅ YES | Security audit. Must be permanently queryable. |
| Password reset | ❌ NO | Covered by logs. Events table would add noise. |
| Subscription cancelled | ✅ YES | Business-critical. Customer needs to see this in billing history. |
| Background job ran | ❌ NO | Technical → logs/traces/metrics. |
| Payment failed | ✅ YES | Business + customer need to know. Permanent record for support. |
| Token refreshed | ❌ NO | Session management → logs only. |

## Stack
- **Logging** (`structlog`): EVERY operation → stdout (JSON in production, pretty in dev)
- **Tracing** (`OpenTelemetry`): EVERY async function → OTEL collector (Grafana Tempo, Jaeger, SigNoz)
- **Metrics** (`Prometheus`): EVERY HTTP request + DB query → `GET /metrics`
- **Events Table** (PostgreSQL): ONLY when Golden Question = YES

## How to Add Observability — The Complete Pattern

Every new function/service must have this:

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

### Logging (EVERY operation — non-negotiable)
```python
from app.core.observability import logger

logger.info("user_registered", user_id=user.id, email=user.email)  # ⚠️ Email is PII — only log hashed/masked in production
logger.warning("login.failed.invalid_password", user_id=user.id, attempts=3)
logger.error("payment.process.failed", error=str(exc), amount=amount)
```

### Tracing (EVERY async function — non-negotiable)
```python
from app.core.observability import async_trace

@async_trace("service.my_operation")
async def my_operation(self, ...):
    ...
```

### Database Metrics (EVERY ORM method — non-negotiable)
```python
from app.core.observability import observe_db

@observe_db("select", "users")   # ← MUST use actual table name, NOT "dynamic"
async def get_users(self):
    ...
```

### Business Event Recording (ONLY when Golden Question = YES)
```python
from app.services.event_service import event_service

# ✅ GOOD — Business event + logs + traces + metrics
await event_service.record(
    event_type="user.registered",
    entity_type="user",
    entity_id=user.id,
    metadata={"email": user.email},
)

# ❌ BAD — Should be logs only (no events table)
await event_service.record(event_type="auth.login", ...)
```

## Middleware — Technical Only (never writes to events table)
| Middleware | Responsibility | Writes to DB? |
|-----------|---------------|:---:|
| `SecurityHeadersMiddleware` | Security headers on every response | No |
| `ObservabilityMiddleware` | Prometheus metrics, trace context, X-Request-ID | No |
| `RequestLoggingMiddleware` | Structured logging of request/response cycles | No |

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

## Configuration
```env
OTEL_ENDPOINT=http://localhost:4318/v1/traces
LOG_LEVEL=INFO
ENABLE_METRICS=true
ENABLE_TRACING=true
```
