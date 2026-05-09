# Testing Patterns — 80%+ Coverage Required

> **MANDATORY:** ALL rules in `RULES.md` apply. This skill supplements, never overrides, `RULES.md`.
> Every PR, commit, and deployment MUST comply with `RULES.md`. Deviations require an ADR.

## Golden Rule
**NO code change is complete without tests. Every feature, bug fix, or refactor requires tests. Aim for 80%+ coverage. Critical paths and business logic must have tests.**
- If tests fail, ask user: *"Tests failed. Would you like me to fix them?"*
- Never push if tests or linter fail
- Every bug fix MUST include a test that reproduces the bug

## Test Structure
```
backend/tests/
  conftest.py        # Fixtures: MockORM, app, client, auth_headers, users
  factories/         # Build test objects (UserFactory, RoleFactory, EventFactory)
  seeding/           # Seed test data for scenarios (basic, full, empty)
  unit/              # Unit tests: isolated function/class tests
  integration/       # API endpoint tests (uses MockORM + TestClient)
  e2e/               # Full user flow tests
```

## Fixtures (conftest.py)
- `mock_orm` — In-memory MockORM that replaces real DB (MUST support ALL filter operators)
- `app` — FastAPI app instance
- `client` — Async HTTP client for API tests
- `user_payload` — Sample registration data
- `admin_user` — Pre-created admin in MockORM
- `customer_user` — Pre-created customer in MockORM
- `auth_headers` — JWT auth headers for admin
- `customer_auth_headers` — JWT auth headers for customer

## Factory Usage
```python
# UserFactory
user = UserFactory.build()
user = UserFactory.admin()
user = UserFactory.technician()
user = UserFactory.member()
user = UserFactory.customer()
user = UserFactory.inactive()
user_data = UserFactory.build_dict()

# RoleFactory
role = RoleFactory.build()
role = RoleFactory.admin()
perm = RoleFactory.build_permission(role_id="123")

# EventFactory
event = EventFactory.build()
event = EventFactory.auth_event()
event = EventFactory.error_event()
```

## Test Categories

### Unit Tests (`tests/unit/`)
- Test single functions/classes in isolation
- No API calls — test business logic directly
- Examples: QueryBuilder methods, password hashing, JWT, RBAC permission checks

### Integration Tests (`tests/integration/`)
- Test API endpoints via `AsyncClient`
- Uses MockORM (no real DB) — but must test ALL filter operators, not just `eq`
- Test: success paths, error paths, auth checks, RBAC enforcement
- One test class per endpoint group

### E2E Tests (`tests/e2e/`)
- Test complete user flows
- Example: register → login → access → refresh → logout
- Test: unauthorized access blocked, invalid tokens rejected

### Performance Tests (REQUIRED for critical paths)
- Login endpoint: 100 concurrent requests
- User list: paginated response times
- Must exist before major releases

### Security Tests (REQUIRED)
- SQL injection attempts on all query parameters
- XSS attempts on text fields
- Rate limiting enforcement
- CORS origin validation

## Frontend Tests
```
frontend/src/tests/
  setup.ts           # Test setup (jest-dom matchers)
  factories/         # Build test data (userFactory.ts)
  unit/              # Unit tests for pure functions
  integration/       # Component tests with rendering
```

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

### What to Test Per Feature
1. **Models**: serialization, `to_response()`, `_table()`
2. **Schemas**: validation (required fields, type checks)
3. **Services**: business logic (success, error, edge cases) — including `count_events` with filters
4. **Routes**: status codes, response shape, auth enforcement
5. **RBAC**: permission checks, role hierarchy, access denials
6. **Observability**: decorators work, metrics recorded, logger functions — verify events table only gets business data
7. **Frontend**: permission helpers, component rendering, auth state
8. **Middleware**: ObservabilityMiddleware metrics, RequestLoggingMiddleware structured logging
9. **`update_by` / `delete_by`**: verify error is raised when no filters provided (guard against mass update/delete)
10. **Events**: verify `count_events` respects all filter parameters (entity_type, event_type, actor_id)

## Golden Rule: Events Table vs Logs

**Logs + Traces + Metrics exist for EVERY operation — always test them.**
The events table only gets data when Golden Question = YES.

When testing observability, verify:
- **Every operation**: has logging, has tracing decorator
- **Business events** (register, payment, role change): events table ALSO has a record
- **Technical operations** (login, refresh, API calls): events table has NO record (logs only)
- **Middleware** never writes to events table — only service code does

## Running Tests
```bash
make test               # All tests
make test-backend       # Backend only
make test-frontend      # Frontend only
pytest tests/ -v --cov=app --cov-report=term-missing  # With coverage
npx vitest run --reporter=verbose  # Frontend tests
```
