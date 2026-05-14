# Backend Architecture (MVP)

> **Source of Truth:** This skill defines ALL backend architecture rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 3.1 Layered Responsibility

Every feature follows **MVP** (Model-View-Presenter):

```
backend/
  app/
    models/         # Model: data shape + DB table mapping
    schemas/        # Presenter: input/output validation
    services/       # Presenter: business logic
    api/v1/         # View: HTTP routes (thin — delegates to services)
    core/           # Config, security, RBAC, dependencies, observability
    middleware/     # SecurityHeaders, RateLimit, Observability, RequestLogging
```

### Layer Rules
- **Models (M):** Define data shape, DB table mapping via `_table()` static method, and `to_response()` method. Located in `app/models/`. Inherit from `AppBaseModel`.
- **Schemas (Presenter):** Pydantic models for input/output validation. Separate Create, Update, and Response schemas. NEVER expose `hashed_password` in responses. Located in `app/schemas/`.
- **Services (Presenter):** Contain ALL business logic, logging, tracing, and ORM calls. Located in `app/services/`.
- **API Routes (View):** Thin handlers that parse requests, check RBAC, delegate to services, and return responses. Located in `app/api/v1/`.

---

## 3.2 Endpoint Standards

- **RESTful:** Use plural nouns (`/users`) and correct HTTP methods (GET, POST, PATCH, DELETE).
- **Versioning:** All endpoints MUST be prefixed with `/api/v{N}/`.
- **Response Shape:** Success responses use `response_model` annotation. Error responses follow: `{"error": {"code": "ERROR_CODE", "message": "Human-readable message"}}`.
- **Response Model:** Every route MUST declare `response_model` for OpenAPI documentation and response validation.
- **Pagination:** List endpoints MUST accept `limit` (default 100, max 1000) and `offset` (default 0). The 100 default ensures the frontend preloader can load all data in a single request without overfetching. Response: `{"data": [...], "total": N, "limit": N, "offset": N}`.

---

## 3.3 Adding a New Feature

1. Create migration in `backend/migrations/` (sequential number, SQL with table, indexes, RLS, triggers)
2. Create model in `app/models/{feature}.py` with `_table()` and `to_response()`
3. Create schemas in `app/schemas/{feature}.py` (Create, Update, Response)
4. Create service in `app/services/{feature}_service.py` with `@async_trace` on every public method
5. Create route in `app/api/v1/{feature}.py` — thin handlers with RBAC + `response_model` + pagination
6. Register route in `app/api/v1/__init__.py`
7. Register schema in `app/schemas/__init__.py`
8. Add RBAC permission to database `permissions` table and `PermissionType` enum in `app/core/rbac.py`
9. Add tests: unit (service), integration (API), E2E (full flow)
10. Add observability: logging, `@async_trace`, metrics, events (if Golden Question = YES)
11. Add frontend: types in `types/{feature}.ts`, API client in `api/{feature}.ts`, React Query hooks in `hooks/use{Feature}Query.ts`, pages in `pages/{feature}/` (List, Detail, Form), route (lazy-loaded in App.tsx), nav link in Header.tsx, bilingual i18n keys in en.json/ar.json, route constant

### Junction Tables (Pure M:N Relationships)
- No soft-delete or update operations — hard delete only
- List + Create pages only (no Detail, no Edit)
- API returns full list (no pagination usually, or simple limit/offset)
- Permission: CREATE + READ + DELETE (no UPDATE)

---

## 3.4 Module Registration Pattern

```python
# app/api/v1/__init__.py
from app.api.v1.{feature} import router as {feature}_router
__all__ = ["{feature}_router", ...]
```
```python
# app/main.py
app.include_router({feature}_router, prefix="/api/v1")
```

---

## 3.5 Change Detection API

- **Endpoint:** `GET /api/v1/changes/check?since=<ISO-8601-timestamp>` — Polled by the frontend to detect database changes.
- **Response Shape:** `{"has_changes": bool, "tables": string[]}`.
- **Service:** `ChangeService` in `app/services/change_service.py` with `@async_trace("change_service.check")`. Uses `orm.query(TableChange).gte("changed_at", since)`.
- **No Auth Required:** The change check endpoint is intentionally unauthenticated — it only reveals that *something* changed, not what changed. Data-level auth is enforced by individual API endpoints.
- **Handler:** `check_changes` in `app/api/v1/changes.py` — parses the ISO timestamp param and delegates to `change_service.check_changes()`.

---

## Hard Rules

1. **Routes (View)** must be thin — only parse request, call service, return response
2. **Services (Presenter)** contain all business logic, call ORM
3. **Models** define data shape and `_table()` for ORM mapping
4. **Schemas** validate input/output (different from models — never expose hashed_password, etc.)
5. Every new feature creates: `migration`, `model`, `schema`, `service`, `api/v1/{feature}.py`, plus `tests/` for each
6. Always update `api/v1/__init__.py`, `schemas/__init__.py`, `main.py`, and `models/__init__.py` when adding new modules
7. **Security, observability, testing are NON-NEGOTIABLE**
8. Every new protected route MUST add RBAC dependency with a database-backed permission check
9. **Dashboard aggregate queries** MUST use `execute_raw` with `reason="dashboard aggregate"` parameter — never bypass the raw SQL audit trail
10. **All new UI strings MUST be bilingual** — add keys to BOTH `en.json` AND `ar.json`
