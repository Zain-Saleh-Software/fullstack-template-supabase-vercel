# Testing — 80%+ Coverage Required

> **Source of Truth:** This skill defines ALL testing rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 12.1 Golden Rule

- **No test = no merge.** Every bug fix, feature, or refactor MUST have tests.
- If tests fail, fix before proceeding. Never push or merge if tests or linter fail.
- Every bug fix MUST include a test that reproduces the bug.

---

## 12.2 Coverage Targets

| Layer | Minimum Coverage |
|-------|:----------------:|
| Backend (overall) | 80% |
| Backend services + routes | 90% |
| Frontend (overall) | 70% |
| Frontend hooks + contexts | 80% |

---

## 12.3 Test Structure

```
backend/tests/
  conftest.py        # Fixtures: MockORM, app, client, auth_headers, users
  factories/         # UserFactory, RoleFactory, EventFactory
  seeding/           # Seed test data for scenarios (basic, full, empty)
  unit/              # Isolated function/class tests
  integration/       # API endpoint tests (MockORM + AsyncClient)
  e2e/               # Full user flow tests
frontend/src/tests/
  setupTests.ts      # jest-dom matchers
  factories/         # userFactory.ts, roleFactory.ts
  unit/              # Pure function tests
  integration/       # Component rendering tests
```

---

## 12.4 Fixtures (conftest.py)

- `mock_orm` — Auto-used fixture. In-memory `MockORM` that replaces real DB via `patch` on `get_orm`. MUST support ALL filter operators.
- `app` — FastAPI test application instance.
- `client` — Async HTTP client (`AsyncClient` with ASGI transport).
- `user_payload` — Sample registration data dict.
- `admin_user` — Pre-created admin user in MockORM.
- `customer_user` — Pre-created customer user in MockORM.
- `auth_headers` — JWT auth headers for admin user.
- `customer_auth_headers` — JWT auth headers for customer user.

---

## 12.5 MockORM Requirements

- MUST be an in-memory dict-based store.
- MUST support ALL QueryBuilder filter operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in_`, `is_null`, `is_not_null`.
- MUST support: `create`, `find_by_id`, `find_by`, `find_one_by`, `update`, `update_by` (with filter guard), `delete`, `delete_by` (with filter guard), `count` (with optional filtered count), `execute_raw`.
- `update_by` and `delete_by` MUST raise error if no filters provided.
- MUST auto-assign UUID `id` if not provided on create.

---

## 12.6 Factories

- MUST generate unique data per test (randomized emails, unique names).
- **UserFactory:** `.build()`, `.admin()`, `.technician()`, `.member()`, `.customer()`, `.inactive()`, `.build_dict()`.
- **RoleFactory:** `.build()`, `.admin()`, `.technician()`, `.member()`, `.customer()`, `.build_permission(role_id)`.
- **EventFactory:** `.build()`, `.auth_event()`, `.error_event()`, `.build_dict()`.

---

## 12.7 Test Categories

### Unit Tests (`tests/unit/`)
- Test single functions/classes in isolation — no API calls.
- Examples: QueryBuilder methods, password hashing, JWT create/decode, RBAC permission checks, observability decorators.
- Cover: success paths, error paths, edge cases.

### Integration Tests (`tests/integration/`)
- Test API endpoints via `AsyncClient` with MockORM.
- Test: success paths, error paths, auth enforcement, RBAC enforcement, validation, response shapes.
- One test class per endpoint group.
- MockORM MUST test ALL filter operators, not just `eq`.

### E2E Tests (`tests/e2e/`)
- Test complete user flows: register → login → /me → check permissions → access restricted resource (403) → refresh → new token works.
- Test: unauthorized access blocked, invalid tokens rejected, multiple users register+login.
- Test admin vs customer permission differences.

### Performance Tests (required for critical paths)
- Login endpoint: 100 concurrent requests.
- User list: paginated response times.
- MUST exist before major releases.

### Security Tests (required)
- SQL injection attempts on all query parameters.
- XSS attempts on text fields.
- Rate limiting enforcement.
- CORS origin validation.

### Authentication Tests (required)
- **User enumeration prevention:** Verify that login, password reset, and registration endpoints return identical responses (message, HTTP status, response time) for existing and non-existing accounts.
- **Generic error messages:** Verify no endpoint reveals "account exists", "invalid password", "account disabled" — only "Invalid user ID or password."
- **Timing attack prevention:** Verify that login code path is constant-time regardless of whether the user exists ("quick exit" pattern is FORBIDDEN).
- **Password strength:** Verify minimum/maximum length enforcement, breached password rejection, character set allowance (all characters including unicode).
- **Account lockout:** Verify lockout after N failed attempts, lockout duration, reset via password recovery.
- **Rate limiting:** Verify login (5/min), register (10/min), refresh (20/min) endpoints respect rate limits.
- **TLS enforcement:** Verify HTTP requests to auth endpoints are rejected or redirected.
- **Change password:** Verify current password is required, all sessions except current are invalidated.
- **MFA:** If implemented, verify MFA challenge is required for sensitive operations.
- **Password manager compatibility:** Verify standard HTML form inputs, paste enabled, Tab navigation works.

### Authorization Tests (required)
- **Deny by default:** Verify unauthenticated requests return 401, authenticated requests without permission return 403 for ALL protected endpoints.
- **Least privilege:** Verify users with a role cannot access resources or actions assigned to higher roles.
- **IDOR prevention:** Verify User A cannot access User B's resources by manipulating IDs (path params, query params, body).
- **Permission granularity:** Verify each distinct permission correctly gates its corresponding action.
- **Static resources:** Verify static files with access restrictions are properly protected.
- **Admin bypass:** Verify admin user can access all resources (the only hardcoded exception).
- **Safe exit:** Verify authorization failures never leak permission names, user roles, or internal details in error responses.

---

## 12.8 What to Test Per Feature

1. **Models:** serialization, `to_response()`, `_table()`, model_dump (exclude sensitive fields)
2. **Schemas:** validation (required fields, type checks, custom validators)
3. **Services:** business logic (success, error, edge cases), events table decisions
4. **Routes:** status codes, response shape, auth enforcement, RBAC enforcement
5. **RBAC:** permission checks, role hierarchy, access denials, admin bypass
6. **Observability:** decorators work, metrics recorded, logger functions, events table only gets business data (Golden Question pass)
7. **Frontend:** permission helpers, component rendering (loading/empty/error/success), auth state
8. **Middleware:** ObservabilityMiddleware metrics counters, RequestLoggingMiddleware structured logging (excludes health)
9. **`update_by`/`delete_by`:** verify error raised when no filters provided
10. **Events:** verify `count_events` respects all filter parameters (entity_type, event_type, actor_id)

---

## 12.9 Test Isolation & Quality

- Tests MUST NOT depend on external services (real Supabase, Redis, etc.) unless explicitly marked as separate integration tests.
- Test databases MUST be ephemeral — created per session, destroyed after.
- Factories MUST generate unique data per test (randomized emails, unique names).
- Fixtures MUST be stateless and reusable.
- ALL assertions MUST be explicit. Avoid `assert x in (a, b)` when exact status code is known.
- Test assertions MUST match actual API response shapes.
- **Flaky Tests:** MUST be quarantined immediately and fixed within 48 hours. A flaky test not fixed within 48h blocks the release.

---

## 12.10 Events Table Testing

- **Every operation:** verify logging exists, tracing decorator applied.
- **Business events** (register, payment, role change): verify events table ALSO has a record.
- **Technical operations** (login, refresh, API calls): verify events table has NO record (logs only).
- **Middleware:** verify it NEVER writes to events table — only service code does.

---

## Running Tests

```bash
make test               # All tests
make test-backend       # Backend only
make test-frontend      # Frontend only
pytest tests/ -v --cov=app --cov-report=term-missing  # With coverage
npx vitest run --reporter=verbose  # Frontend tests
```

---

## Hard Rules

### ORM Testing
- Tests MUST use a test database or in-memory database for ORM testing.
- `MockORM` MUST support ALL filter operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in_`, `is_null`, `is_not_null`.
- MockORM-only testing that ignores filter operators is FORBIDDEN.

### Coverage Requirements
- Backend: minimum 80% line coverage, 90% for services and API routes.
- Frontend: minimum 70% for utilities, 80% for hooks and contexts.
- NO code may be merged with <70% coverage on changed files.

### Assertions
- All assertions MUST be explicit. Avoid `assert x in (a, b)` when exact status code is known.
- Test assertions MUST match the actual API response shape (e.g., health check MUST include `database` key).

### Test Isolation
- Tests MUST NOT depend on external services (Supabase, Redis) unless explicitly marked as integration.
- Test databases MUST be created per test session and destroyed after.
- Factories MUST generate unique data per test (randomized emails, unique names).
- Fixtures MUST be stateless and reusable.

### Flaky Tests
- Flaky tests MUST be quarantined immediately and fixed within 48 hours.
- A flaky test that is not fixed within 48h blocks the release.
