# Middleware Stack

> **Source of Truth:** This skill defines ALL middleware rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## Stack Ordering (last added = first executed)

1. **GZipMiddleware** — Compress responses >= 1000 bytes
2. **RequestLoggingMiddleware** — Log request/response cycles
3. **ObservabilityMiddleware** — Prometheus metrics + trace context
4. **CORSMiddleware** — Cross-origin resource sharing
5. **SecurityHeadersMiddleware** — Security headers on every response
6. **HostValidationMiddleware** — Validate Host header
7. **BodySizeLimitMiddleware** — 10MB max body size
8. **AuthenticationMiddleware** — JWT validation + current user resolution (runs before all route handlers)
9. **AuthorizationMiddleware** — Global permission enforcement (deny-by-default gate for all routes)

---

## Middleware Responsibilities

| Middleware | Responsibility | Writes to Events Table? |
|-----------|---------------|:-----------------------:|
| GZipMiddleware | Compress responses >= 1000 bytes | No |
| RequestLoggingMiddleware | Structured logging of method, path, status, duration, client_ip, request_id | No |
| ObservabilityMiddleware | Prometheus metrics (`http_requests_total`, `http_request_duration_seconds`), trace context, `X-Request-ID` header | No |
| CORSMiddleware | CORS headers from `CORS_ORIGINS` config | No |
| SecurityHeadersMiddleware | HSTS (prod), X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy | No |
| HostValidationMiddleware | Validates Host against ALLOWED_HOSTS, returns 400 on mismatch | No |
| BodySizeLimitMiddleware | 10MB limit, returns 413 on exceed | No |
| AuthenticationMiddleware | Validates JWT from HTTP-only cookie, resolves `current_user`, sets `user_id_var` context var. Skips on public routes. | No |
| AuthorizationMiddleware | Global deny-by-default gate. Rejects requests to protected routes without valid permissions. Returns 403. | No |

---

## Hard Rules

### Events Table
- **Middleware MUST NOT write to the events table** — only service code does.

### Request Logging
- `RequestLoggingMiddleware` MUST exclude health check, metrics, and docs paths to reduce noise.

### Observability
- MUST record `http_requests_total` (labels: method, endpoint, status) and `http_request_duration_seconds` (labels: method, endpoint).
- MUST set `X-Request-ID` header on every response.

### Security Headers
- MUST be applied via ASGI middleware (not Nginx) so they work in all deployment targets.
- `SecurityHeadersMiddleware` MUST only set HSTS in production environment.
- **Password reset pages** MUST additionally override `Referrer-Policy` to `noreferrer` to prevent reset token leakage via the HTTP Referer header. This can be done per-route in the reset page handler.

### Content-Type Validation Middleware
- `BodySizeLimitMiddleware` and content-type validation MUST only enforce Content-Type when the request has an actual body (Content-Length > 0).
- POST/PATCH/PUT endpoints that accept no body (e.g., `/auth/logout`) MUST NOT require `Content-Type: application/json`.
- The middleware MUST check `content-length` header before enforcing type constraints to avoid false 415 errors on bodyless requests.

### Authentication Middleware
- `AuthenticationMiddleware` MUST extract and validate JWT from HTTP-only cookie on every request.
- MUST set `user_id_var` context variable on successful authentication for observability correlation.
- MUST skip validation on explicitly public routes (health, docs, login, register).
- MUST NOT write to events table (auth is a technical operation, not a business event).

### Authorization Middleware
- `AuthorizationMiddleware` MUST apply deny-by-default: any route not explicitly marked as public requires valid authentication.
- MUST check permissions for protected routes before they execute.
- MUST return 403 with generic message on failure.
- MUST NOT leak permission names or user role details in error responses.
- MUST increment `auth_failures_total` metric on denial.
