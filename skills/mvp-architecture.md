# MVP Architecture Pattern

> **MANDATORY:** ALL rules in `RULES.md` apply. This skill supplements, never overrides, `RULES.md`.
> Every PR, commit, and deployment MUST comply with `RULES.md`. Deviations require an ADR.

## Directory Structure
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

## Rules
1. **Routes (View)** must be thin — only parse request, call service, return response
2. **Services (Presenter)** contain all business logic, call ORM
3. **Models** define data shape and `_table()` for ORM mapping
4. **Schemas** validate input/output (different from models — never expose hashed_password, etc.)
5. Every new feature creates: `model`, `schema`, `service`, `api/v1/{feature}.py`, plus `tests/` for each
6. Always update `api/v1/__init__.py` and `schemas/__init__.py` when adding new modules
7. **Security, observability, testing are NON-NEGOTIABLE** — see RULES.md for enforcement

## Adding a New Feature
1. Create model in `app/models/{feature}.py` with `_table()` static method and `to_response()`
2. Create schemas in `app/schemas/{feature}_schema.py` (Create, Update, Response) with Pydantic validation
3. Create service in `app/services/{feature}_service.py` with:
   - `@async_trace` decorator on every public method
   - Proper logging (start, end, errors)
   - Business event recording (if Golden Question = YES per observability-patterns.md)
4. Create route in `app/api/v1/{feature}.py` with:
   - Thin handlers (parse → delegate → return)
   - `response_model` annotation
   - RBAC permission checks (database-driven, NOT hardcoded)
   - Pagination for list endpoints (limit/offset with sensible defaults)
5. Register in `app/api/v1/__init__.py`
6. Add RBAC permissions to the database permission table (NOT hardcoded in code)
7. Add i18n translation keys in `frontend/src/i18n/en.json` and `ar.json`
8. Add tests: unit (service logic), integration (API endpoint), E2E (full flow)
9. Add observability: logging, `@async_trace` decorator, metrics recording
10. Add frontend preloading via `@tanstack/react-query` (NOT custom PreloaderContext)
11. Update `RULES.md` if any new rule emerges from the feature
