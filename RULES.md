# Fullstack Template — The Ultimate Hard Rules

**Version:** 3.0.0
**Scope:** Applies to ALL code, configurations, infrastructure, and processes in any project derived from this template.
**Template Boundaries:** This project is a foundational template. When generating new projects or adding features, **NO structural changes** to the architecture and **NO overarching design/styling changes** to the core UI components are permitted. Allowed modifications are strictly limited to: config updates (`.env`, feature flags), adding new APIs, adding new ORM methods, adding specific business logic, and creating new pages using existing layouts and components.
**Component Reusability:** Always reuse existing components, utilities, and services. Do not reinvent patterns or build redundant components.
**Enforcement:** These rules are NON-NEGOTIABLE. Every PR, commit, and deployment MUST comply. AI and human contributors MUST satisfy all rules to maintain a secure, reliable, fast, and well-structured application.
**Single Source of Truth:** This document consolidates ALL patterns from the template codebase and supersedes all individual skill files. Skill files exist as reference only.

---

## 1. Security Rules — Zero Tolerance

### 1.1 SQL Injection
- **Parameterization:** NEVER use f-strings or string concatenation for SQL queries. ALL dynamic values MUST use parameterized queries (`$1`, `$2`, ...).
- **Pagination Safety:** `LIMIT` and `OFFSET` MUST be passed as query parameters, NOT interpolated.
- **Raw SQL Audit:** `execute_raw` MUST only be used for read-only operations in migrations and MUST include a `reason` parameter documenting the need.

### 1.2 Secrets & Credentials
- **No Hardcoding:** API keys, secrets, DB URLs, or tokens MUST NEVER be in source code.
- **Fail-Safe Config:** Default values for secrets in `Settings` MUST be `None` or empty strings, triggering a startup error if missing in non-dev environments.
- **Git Safety:** `.env` files MUST be ignored. Pre-commit hooks MUST block commits containing secrets or `.env` files.
- **Supabase Key Separation:** Service role key (`SUPABASE_SERVICE_ROLE_KEY`) MUST be used for write operations only. Anon key (`SUPABASE_ANON_KEY`) MUST be used for read operations.

### 1.3 Authentication & Authorization
- **JWT Standards:** Tokens MUST include `iat`, `exp`, `sub`, `jti`, and `type` (access/refresh) claims.
- **Algorithm:** HS256 is the ONLY supported algorithm. Configure via `JWT_ALGORITHM=HS256`. RS256 fallback is REMOVED.
- **Expiration:** Access tokens: max 15 mins (`JWT_ACCESS_TOKEN_EXPIRE_MINUTES`). Refresh tokens: max 7 days (`JWT_REFRESH_TOKEN_EXPIRE_DAYS`).
- **Rotation:** Refresh tokens MUST be rotated on every use; old tokens MUST be invalidated.
- **Reuse Detection:** If a used refresh token is presented again (`is_refresh_used` returns true), ALL user tokens MUST be revoked immediately (`revoke_all_user_tokens`). This signals token theft.
- **Blacklist:** Token `jti` MUST be blacklisted in Redis on logout. Every authenticated request MUST check `is_blacklisted(jti)`.
- **Bcrypt:** Use `bcrypt` (cost >= 12) for password hashing via `passlib`.
- **Password Policy:** Minimum 8 characters. Enforced at service layer.
- **Account Lockout:** Rate limit login endpoints (5 attempts/min). Implement account lockout after 10 failed attempts.
- **RBAC:** Permissions MUST be database-driven (`permissions` table), not hardcoded. Frontend checks are for UX only; the Backend MUST independently enforce permissions on every sensitive request.
- **Optional Auth:** Use `get_optional_user` dependency for endpoints that work with or without authentication (returns `None` if no valid token).

### 1.3.1 HS256 Algorithm — MANDATORY
- **HS256 is the ONLY supported JWT signing algorithm.** RS256 is REMOVED.
- Algorithm MUST be set to `JWT_ALGORITHM=HS256` in environment configuration.
- `JWT_SECRET` MUST be at least 256 bits (32 characters) for HS256 security.
- All RS256-specific code paths, key pairs, and fallback logic are REMOVED.

### 1.4 API Security
- **Security Headers:** Every response MUST include:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: default-src 'self'`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production only)
- **Rate Limiting:** Global rate limit (100 req/min per IP) enforced via `slowapi`. Login: 5/min. Register: 10/min. Refresh: 20/min.
- **Validation:** ALL user input MUST be validated using Pydantic (Backend) and custom validators (Frontend).
- **Frontend Validation Pattern:** All form inputs MUST validate data BEFORE submission to backend. Invalid entities MUST NOT be sent to backend if they can be rejected at the frontend.
  - **Required Fields:** Must have non-empty value, proper type, and length requirements.
  - **Optional Fields:** Can be empty or null, but if provided must validate format.
  - **Type Safety:** All inputs MUST validate types (strings, numbers, booleans) to prevent type mismatches.
  - **Error Handling:** Show friendly, user-friendly error messages under each invalid field. Use red borders and text for visual feedback.
  - **Real-time Validation:** Clear errors when user starts typing/interaction begins.
  - **Disabled Submit:** Submit button MUST be disabled when form has validation errors.
  - **Accessibility:** All validation errors MUST have `role="alert"` and `aria-invalid="true"`.
  - **Database Constraints:** All string fields MUST have check constraints for validation.
- **Sanitization:** Sanitize all user-provided text with `bleach.clean(text, tags=[], strip=True)` before DB insertion.
- **Body Size Limit:** Maximum request body size: 10MB. Enforced via middleware returning 413 `{"error": {"code": "PAYLOAD_TOO_LARGE", "message": "Request body too large"}}`.
- **Host Validation:** Validate `Host` header against `ALLOWED_HOSTS`. Return 400 `{"error": {"code": "INVALID_HOST", "message": "Invalid host header"}}` on mismatch.
- **CORS:** Configured via `CORSMiddleware` with `allow_origins` from `CORS_ORIGINS` env var, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`.

---

## 2. Database & ORM Rules

### 2.1 Schema Design
- **Primary Keys:** Every table MUST use UUID primary keys (`gen_random_uuid()`).
- **Audit Fields:** Every table MUST have `created_at` (TIMESTAMPTZ) and `updated_at` (TIMESTAMPTZ with auto-update trigger).
- **Constraints:** Uniqueness (e.g., email) MUST be enforced at the DB level (UNIQUE constraint), not just the app level.
- **Row-Level Security (RLS):** RLS MUST be enabled on all tables.
- **Auto-Update Trigger:** Every table MUST have a trigger that auto-updates `updated_at` on row modification.
- **Change Tracking:** Every mutable table MUST have a `notify_table_change` trigger (AFTER INSERT/UPDATE/DELETE, STATEMENT-level) that inserts into `table_changes`. The `table_changes` table MUST be added to `VALID_COLUMNS` in `postgres_orm.py`.

### 2.2 ORM Architecture
- **BaseORM:** All DB implementations MUST inherit from abstract `BaseORM`.
- **Implementations:** Two implementations exist — `PostgresORM` (asyncpg) and `SupabaseORM` (httpx REST).
- **Factory:** Use `get_orm()` factory which selects implementation based on `settings.db_type` ("supabase" or "postgres").
- **Cleanup:** Call `close_orm()` on application shutdown to release pool/connections.
- **QueryBuilder:** Use chained filter methods (`.eq()`, `.gt()`, `.in_()`) exclusively. Never build raw strings in the service layer.
- **Column Validation (PostgresORM):** Every column name in queries MUST be validated against `VALID_COLUMNS` dict before execution. Unknown columns raise `ValueError`.

### 2.3 ORM CRUD Standards
- `find_all(model, limit, offset)` — Get all records with pagination
- `find_by_id(model, id)` — Get by primary key
- `find_by(model, builder, limit, offset)` — Filtered list
- `find_one_by(model, builder)` — Single result or None
- `create(model, data)` — Insert one
- `create_many(model, data_list)` — Batch insert (MUST use multi-row INSERT syntax — NEVER row-by-row)
- `update(model, id, data)` — Update by ID
- `update_by(model, builder, data)` — Update matching (REQUIRES at least one filter — raise error if none)
- `delete(model, id)` — Delete by ID
- `delete_by(model, builder)` — Delete matching (REQUIRES at least one filter — raise error if none)
- `count(model, builder?)` — Total count. MUST accept optional QueryBuilder for filtered counts.
- `execute_raw(query, params)` — Raw SQL. FORBIDDEN in API handlers. Requires `reason` parameter.

### 2.4 Available QueryBuilder Methods
- `.eq()`, `.neq()` — Equality
- `.gt()`, `.gte()`, `.lt()`, `.lte()` — Comparisons
- `.like()`, `.ilike()` — Pattern matching
- `.is_null()`, `.is_not_null()` — Null checks
- `.in_()` — IN clause
- `.order(column, direction)` — Sorting
- `.limit()`, `.offset()` — Pagination
- `.range(start, end)` — Range queries
- `.select(*columns)` — Specific columns (default: all)

### 2.5 Performance
- **Indexing:** Every column used in `WHERE`, `JOIN`, or `ORDER BY` MUST be indexed.
- **Composite Indexes:** Add composite indexes for common query patterns: `permissions (action, resource)`, `events (entity_type, created_at)`, `events (actor_id, created_at)`, `users (role, created_at)`.
- **Events Partitioning:** Events table MUST be partitioned by month range on `created_at` for production. Include auto-partition function for pg_cron.
- **Pool Management:** `max_size = min(workers * 4, 50)`. `min_size = max(settings.db_pool_min_size, 2)`.
- **Pool Retry:** Pool creation MUST have retry logic with exponential backoff (5 attempts, starting at 1s).
- **Command Timeout:** Every query MUST have `command_timeout=30` (max 30s).
- **TLS/SSL:** Database connections MUST use `ssl='require'`.
- **No N+1:** Fetch related data using JOINs or batching; never query in a loop.
- **Selectivity:** `SELECT *` is FORBIDDEN in production. Always select specific columns. Use QueryBuilder `.select()`.
- **Keyset Cursor:** Support keyset cursor pagination alongside offset pagination for large datasets.

### 2.6 ORM Observability
- EVERY ORM method MUST be decorated with BOTH:
  - `@async_trace("orm.{impl}.{operation}")` — e.g., `@async_trace("orm.postgres.find_by")`
  - `@observe_db("{operation}", "{actual_table_name}")` — MUST use actual table name, NEVER `"dynamic"`
- "Slow query" threshold: log warning for queries exceeding 1000ms.
- Every ORM operation MUST have structured logging (start, completion, errors).

### 2.7 Database Change Tracking
- **`table_changes` Table:** A dedicated log table (`table_changes`) MUST exist with columns: `id` (UUID PK), `table_name` (TEXT), `operation` (INSERT/UPDATE/DELETE), `changed_at` (TIMESTAMPTZ). Created via migration.
- **Trigger Function:** `notify_table_change()` trigger function MUST be defined. It inserts a row into `table_changes` with `TG_TABLE_NAME` and `TG_OP`. It MUST be STATEMENT-level (not row-level) to avoid excessive writes on batch operations.
- **Tracked Tables:** Every mutable table (users, roles, permissions, events) MUST have `AFTER INSERT OR UPDATE OR DELETE` triggers calling `notify_table_change()`.
- **Retention:** `table_changes` records older than 7 days MUST be periodically pruned (via pg_cron or scheduled job) to prevent unbounded growth.
- **Model:** A `TableChange` Pydantic model MUST exist in `app/models/table_change.py` with `_table()` returning `"table_changes"`.
- **ORM Registration:** `"table_changes"` column set MUST be added to `VALID_COLUMNS` in `postgres_orm.py`.

### 2.8 Type Consistency (DB <-> Model/Schema)
- Model field types MUST exactly match DB column types. A field stored as `double precision` in the DB MUST be `float` in the Pydantic model — NOT `str`.
- Any mismatch between Pydantic model types and actual DB column types will cause **500 errors** at runtime when the ORM attempts to construct models from DB rows.
- Always verify DB column types via migration SQL or psql `\d tablename` before defining model/schema types.
- `decimal`/`numeric` DB types map to `float` in Pydantic (use `Optional[float]` for nullable numeric columns).
- Coordinate fields (`lat`, `lng`) in any entity MUST use `float`, NOT `str`.
- When adding a new entity, cross-reference all model field types with the actual migration SQL column types.

### 2.9 Database Migrations
- Migration files MUST be sequentially numbered (`001_initial.sql`, `002_...`, `003_...`).
- Migrations MUST run and succeed BEFORE application deployment starts.
- Partition migrations: rename old table, create partitioned table, copy data, recreate indexes, re-enable RLS.
- All migration SQL MUST be idempotent where possible.

---

## 3. Backend Architecture (MVP)

### 3.1 Layered Responsibility
- **Models (M):** Define data shape, DB table mapping via `_table()` static method, and `to_response()` method. Located in `app/models/`. Inherit from `AppBaseModel`.
- **Schemas (Presenter):** Pydantic models for input/output validation. Separate Create, Update, and Response schemas. NEVER expose `hashed_password` in responses. Located in `app/schemas/`.
- **Services (Presenter):** Contain ALL business logic, logging, tracing, and ORM calls. Located in `app/services/`.
- **API Routes (View):** Thin handlers that parse requests, check RBAC, delegate to services, and return responses. Located in `app/api/v1/`.

### 3.2 Endpoint Standards
- **RESTful:** Use plural nouns (`/users`) and correct HTTP methods (GET, POST, PATCH, DELETE).
- **Versioning:** All endpoints MUST be prefixed with `/api/v{N}/`.
- **Response Shape:** Success responses use `response_model` annotation. Error responses follow: `{"error": {"code": "ERROR_CODE", "message": "Human-readable message"}}`.
- **Response Model:** Every route MUST declare `response_model` for OpenAPI documentation and response validation.
- **Pagination:** List endpoints MUST accept `limit` (default 100, max 1000) and `offset` (default 0). The 100 default ensures the frontend preloader can load all data in a single request without overfetching. Response: `{"data": [...], "total": N, "limit": N, "offset": N}`.

### 3.3 Adding a New Feature
1. Create model in `app/models/{feature}.py` with `_table()` and `to_response()`
2. Create schemas in `app/schemas/{feature}.py` (Create, Update, Response)
3. Create service in `app/services/{feature}_service.py` with `@async_trace` on every public method
4. Create route in `app/api/v1/{feature}.py` — thin handlers with RBAC + `response_model` + pagination
5. Register route in `app/api/v1/__init__.py`
6. Register schema in `app/schemas/__init__.py`
7. Add RBAC permission to database `permissions` table and `PermissionType` enum
8. Add tests: unit (service), integration (API), E2E (full flow)
9. Add observability: logging, `@async_trace`, metrics, events (if Golden Question = YES)
10. Add frontend: types, API client, React Query hooks, page, route (lazy-loaded), i18n keys, tests

### 3.4 Module Registration Pattern
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

### 3.5 Notification Creation on Assignment
- Any service method that updates a resource's assignment or ownership (e.g., `complaint_service.update()` with `assigned` field) MUST create a notification for the assignee.
- The notification creation logic MUST live in the service layer (not the route) and MUST be extracted into a private helper (e.g., `_notify_assignee()`).
- The helper MUST find the target user by matching the assignee name against the `users` table using `ilike`.
- The helper MUST be wrapped in try/except so that notification failure does not block the primary update operation.
- The notification MUST include: descriptive `title`, descriptive `body`, `type="assignment"`, and `user_id` of the assignee.

### 3.6 Change Detection API
- **Endpoint:** `GET /api/v1/changes/check?since=<ISO-8601-timestamp>` — Polled by the frontend to detect database changes.
- **Response Shape:** `{"has_changes": bool, "tables": string[]}`.
- **Service:** `ChangeService` in `app/services/change_service.py` with `@async_trace("change_service.check")`. Uses `orm.query(TableChange).gte("changed_at", since)`.
- **No Auth Required:** The change check endpoint is intentionally unauthenticated — it only reveals that *something* changed, not what changed. Data-level auth is enforced by individual API endpoints.
- **Handler:** `check_changes` in `app/api/v1/changes.py` — parses the ISO timestamp param and delegates to `change_service.check_changes()`.

## 4. Middleware Stack

### 4.1 Ordering (last added = first executed)
1. **GZipMiddleware** — Compress responses >= 1000 bytes
2. **RequestLoggingMiddleware** — Log request/response cycles
3. **ObservabilityMiddleware** — Prometheus metrics + trace context
4. **CORSMiddleware** — Cross-origin resource sharing
5. **SecurityHeadersMiddleware** — Security headers on every response
6. **HostValidationMiddleware** — Validate Host header
7. **BodySizeLimitMiddleware** — 10MB max body size

### 4.2 Middleware Responsibilities

| Middleware | Responsibility | Writes to Events Table? |
|-----------|---------------|:-----------------------:|
| GZipMiddleware | Compress responses >= 1000 bytes | No |
| RequestLoggingMiddleware | Structured logging of method, path, status, duration, client_ip, request_id | No |
| ObservabilityMiddleware | Prometheus metrics (`http_requests_total`, `http_request_duration_seconds`), trace context, `X-Request-ID` header | No |
| CORSMiddleware | CORS headers from `CORS_ORIGINS` config | No |
| SecurityHeadersMiddleware | HSTS (prod), X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy | No |
| HostValidationMiddleware | Validates Host against ALLOWED_HOSTS, returns 400 on mismatch | No |
| BodySizeLimitMiddleware | 10MB limit, returns 413 on exceed | No |
| ContentTypeValidationMiddleware | Validates Content-Type is application/json for POST/PATCH/PUT with body | No |

### 4.3 Middleware Hard Rules
- **Middleware MUST NOT write to the events table** — only service code does.
- `RequestLoggingMiddleware` MUST exclude health check, metrics, and docs paths to reduce noise.
- `ObservabilityMiddleware` MUST record `http_requests_total` (labels: method, endpoint, status) and `http_request_duration_seconds` (labels: method, endpoint).
- `ObservabilityMiddleware` MUST set `X-Request-ID` header on every response.
- Security headers MUST be applied via ASGI middleware (not Nginx) so they work in all deployment targets.
- `SecurityHeadersMiddleware` MUST only set HSTS in production environment.
- **Content-Type validation middleware MUST only enforce Content-Type when the request has a body** (Content-Length > 0). POST/PATCH/PUT endpoints with no body (e.g., `/auth/logout`) MUST NOT require `Content-Type: application/json`. Check `content-length` header before enforcing type constraints.

---

## 5. Frontend Architecture

### 5.1 Directory Structure (Mandatory)
```
src/
  api/             # Axios client + API modules (one per backend resource)
  components/
    Layout/        # LayoutWrapper, Header, Footer
    ui/            # Reusable UI primitives (Button, Input, Skeleton)
    auth/          # ProtectedRoute
    rbac/          # RoleGuard, PermissionGate, UserRoleBadge
  contexts/        # AuthContext, LocaleContext (NOT PreloaderContext — deprecated)
  hooks/           # useAuth, useLocale, custom query hooks
  pages/           # Page components (one per route, lazy-loaded)
  types/           # TypeScript interfaces (index.ts, api.ts, user.ts, role.ts)
  i18n/            # Translation JSON files (en.json, ar.json)
  utils/           # Constants, helpers
  tests/           # Factories, unit tests, integration tests
```

### 5.2 State Management
- **Server State:** Use `@tanstack/react-query` EXCLUSIVELY. Custom preloading/caching (`PreloaderContext`, `usePreloader`) is FORBIDDEN.
- **Auth State:** Use `AuthContext`. Do NOT read `localStorage` directly in components.
- **Form State:** Use `react-hook-form` + `zod`. Manual `useState` for forms is FORBIDDEN.
- **URL State:** Use `react-router-dom` hooks (`useSearchParams`, `useParams`).

### 5.3 Routing & Code Splitting
- All page components MUST be lazy-loaded with `React.lazy()` + `Suspense`.
- Suspense fallback MUST use the `Skeleton` component (not a plain "Loading..." text).
- Routes are defined in `App.tsx` with `react-router-dom` `Routes`/`Route`.
- Protected routes use `<ProtectedRoute>` wrapper component.
- Layout is applied via `<LayoutWrapper>` wrapping `<Outlet>` or route children.

### 5.3.5 User-Friendly Naming — MANDATORY
- **Buttons** MUST use human-readable labels (e.g., "Register", "Save Changes", "Create Contact"). NEVER use i18n keys, code names, or internal identifiers as button text.
- **Page titles and headings** MUST be user-friendly (e.g., "Contact Details" not "contact_detail_page").
- **Form labels** MUST be human-readable (e.g., "First Name" not "first_name" or "firstName").
- **Error messages** MUST be user-friendly and specific (e.g., "Email address is not valid" not "invalid_email").
- **Navigation links** MUST use human-readable names (e.g., "Dashboard", "Contacts" not "dash", "contacts-list").

### 5.3.6 Search Validation — MANDATORY
- **All search inputs MUST validate** user input before sending queries.
- **Minimum 2 characters** enforced before triggering a search.
- **Debounce 300ms minimum** before API calls.
- **Trim input** and reject whitespace-only searches.
- **Clear/reset button** MUST be present on every search input.
- **Loading state** (spinner/skeleton) MUST display during search.
- **Empty results** MUST show "No results found" with suggestion to try different terms.
- **Error handling** MUST display user-friendly error with retry option.
- **Keyboard support:** Enter triggers search, results keyboard-navigable.

### 5.4 File & Component Conventions
- **PascalCase:** Component file names MUST match their default export name.
- **Co-location:** Tests MUST be co-located with the component they test.
- **Class Components:** FORBIDDEN except for `ErrorBoundary` (which MUST be a class component).
- **React.memo:** Use for frequently rendered components with same props.
- **useCallback/useMemo:** Use for callbacks and values passed to memoized children.
- **Default Exports:** Every page and component MUST use default export.

### 5.5 Axios Client Rules
- **Base Configuration:** Create Axios instance with `baseURL` from `VITE_API_BASE_URL`, timeout 30s.
- **Request Interceptor:** Attach `Bearer` token from `localStorage` on every request.
- **Response Interceptor (401):** Attempt token refresh with deduplication (`refreshPromise` pattern — only one refresh at a time). On success, update stored tokens and retry original request. On failure, clear tokens and redirect to `/login`.
- **Network Retry:** Retry on network error with exponential backoff (max 3 attempts, delay: `min(1000 * 2^attempt, 10000)`).
- **Skip Auth:** Support `skipAuth` option in request config for public endpoints.

### 5.6 CSS & Styling
- **Tailwind CSS** is the ONLY styling framework. Bootstrap, styled-components, CSS modules are FORBIDDEN.
- **Class Composition:** Use `clsx` + `tailwind-merge` for safe class composition. Template literal concatenation is FORBIDDEN.
- **Fonts:** MUST be self-hosted via `@fontsource/inter` (LTR) and `@fontsource/cairo` (RTL). Preloaded with `<link rel="preload">`.
- Base styles (Tailwind directives, CSS variables for fonts, body font-family) in `index.css`.

### 5.7 Global Preloading Pattern
- **Purpose:** On initial app load, preload ALL essential data (up to 100 items per resource) into React Query cache behind a full-screen loading spinner. This eliminates per-page loading skeletons and ensures the app feels instantly responsive after the initial load.
- **Component:** `AppPreloader` in `components/AppPreloader.tsx` — wraps the app tree inside `QueryProvider`. Uses `useQueryClient.prefetchQuery()` with `Promise.allSettled` to preload all queries in parallel. Shows a centered spinning indicator with `role="status"` until all prefetches settle.
- **Fail-Soft:** Preloader uses `Promise.allSettled` — if any preload fails, the app still loads gracefully and individual pages handle their own error states.
- **Limit 100:** Every preload query MUST use the default `limit=100` to ensure fast single-request loading. Backend endpoints default to `limit=100` to support this.
- **Scope:** Currently preloads `users.list` and `events.list`. Add new preloads as the app grows.
- **staleTime:** Preloaded queries MUST use `staleTime: 30_000` (30s) so they remain fresh for subsequent page interactions.

### 5.8 TypeScript Types Structure
- `types/index.ts`: Shared types — `Locale` (`'en'|'ar'`), `Direction` (`'ltr'|'rtl'`), `Preloadable<T>` (deprecated), `PaginatedResponse<T>`, `ApiError`.
- `types/api.ts`: `ApiConfig` (baseURL, timeout, headers), `RequestOptions` (extends AxiosRequestConfig with skipAuth).
- `types/user.ts`: `User`, `LoginRequest`, `RegisterRequest`, `AuthResponse`.
- `types/role.ts`: `RoleType`, `PermissionType` (union of all 16 permissions), `ROLE_PERMISSIONS` mapping, `hasPermission()`, `hasRole()` helpers.
- Every new feature MUST add a dedicated types file (`types/{feature}.ts`).

---

## 6. Component Design & Patterns

### 6.1 Button
- **Imports:** `forwardRef`, `memo` from React. `clsx` + `tailwind-merge` for class composition.
- **Variants:** `primary` (solid blue), `secondary` (outline), `danger` (red), `ghost` (transparent).
- **Sizes:** `sm`, `md` (default), `lg`.
- **States:** Normal, hover, focus (ring), disabled (opacity + cursor-not-allowed), loading (spinner + disabled).
- **Loading:** Show spinner SVG, disable interaction, `aria-busy="true"`.
- **Accessibility:** Focus ring, `aria-label` for icon-only buttons.

### 6.2 Input
- **Imports:** `forwardRef`, `memo`.
- **Props:** `label`, `error`, `helperText`, plus all standard input props.
- **Error State:** Show error message with `role="alert"`, set `aria-invalid="true"`, `aria-describedby` pointing to error element.
- **Label:** Always render `<label>` with `htmlFor` matching input `id`.

### 6.3 Skeleton
- **Generic:** `animate-pulse` div with configurable `className` for width/height.
- **SkeletonTable:** Grid of skeleton rows/columns for table loading state.
- **SkeletonCard:** Card-shaped skeleton for card loading state.
- **Accessibility:** `role="status"`, `aria-label="Loading..."`.

### 6.4 ProtectedRoute
- **Behavior:** Check `isAuthenticated` from `useAuth()`. If loading, show `<Skeleton>` spinner. If not authenticated, redirect to `/login?return={currentPath}`. If authenticated, render `<Outlet>` or children.
- **Usage:** Wraps route element in `App.tsx`.

### 6.5 Layout Components
- **LayoutWrapper:** Full `flex-col` min-h-screen layout. Children in `<main>` with `max-w-7xl mx-auto`. Wraps with `LocaleProvider`.
- **Header:** Memoized. Contains locale toggle (en/ar), logo/home link, dashboard link (if authenticated), login/logout buttons, user display name.
- **Footer:** Memoized. Contains copyright, privacy link, terms link.

### 6.6 RBAC Components
- **PermissionGate:** `permission` prop (required), `fallback` prop (optional, default `null`). Shows children if user has the specified permission. Uses `hasPermission()` from `types/role.ts`.
- **RoleGuard:** `roles` prop (array of RoleType), `fallback` prop (optional). Admin always passes (admin bypass). Shows children if user's role is in the allowed list.
- **UserRoleBadge:** Displays role name as colored badge: admin=purple, technician=blue, member=green, customer=gray.

### 6.7 ErrorBoundary
- MUST be a class component (ONLY exception to class component rule).
- MUST wrap the entire app tree at the outermost level.
- Fallback UI: Error message + "Reload" button.
- Catches: rendering errors, lifecycle errors, async errors in components.

---

## 7. State Management & Data Fetching

### 7.1 React Query Rules
- `PreloaderContext` / `usePreloader` is **DEPRECATED** — all new code MUST use `@tanstack/react-query`.
- `QueryClient` MUST be configured with: `retry: 1`, `refetchOnWindowFocus: false`, default `staleTime: 30000` (30s).
- **Query Keys MUST follow:** `['entityName']` for lists, `['entityName', id]` for single items, `['entityName', { filters }]` for filtered queries. Pagination state MUST be in the query key.
- **staleTime MUST be configured per query:** user data (30s–5min), reference data (30min), real-time data (0).
- **Cache Invalidation:** MUST happen on mutations via `queryClient.invalidateQueries({ queryKey: ['entityName'] })`.
- **Optimistic Updates:** MUST be used for mutations affecting the current user's visible data. Rollback on error.
- **Error States:** EVERY query MUST handle: `isLoading`, `isError`, `error`, `data` (empty + populated).
- **Pagination:** Query key MUST include page/offset so React Query auto-refetches on change.

### 7.2 Data Fetching Pattern
```tsx
// Query (GET)
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['entity', { filters }],
  queryFn: () => api.list(filters),
  staleTime: 5 * 60 * 1000,
})

// Mutation (POST/PATCH/DELETE)
const mutation = useMutation({
  mutationFn: (data) => api.create(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entity'] }),
  onError: (err) => handleError(err),
})
```

### 7.3 Real-Time Change Detection (Polling)
- **Mechanism:** Frontend polls `GET /api/v1/changes/check?since=<ISO-8601-timestamp>` every 5 seconds via the `useTableChanges` hook.
- **`useTableChanges` Hook** (`hooks/useTableChanges.ts`): Manages polling interval, tracks `hasChanges` state, stores `lastCheckedRef` timestamp. Exposes `{ hasChanges, lastTables, acknowledgeChanges, refresh }`.
- **`UpdateBanner` Component** (`components/UpdateBanner.tsx`): Fixed-position blue banner at the top of the viewport (`z-50`). Shows "New updates available" message + "Refresh" button + dismiss (X) button. Triggered when `hasChanges` becomes true. Animates in with `slide-down` CSS keyframe.
- **Acknowledge:** Dismissing the banner calls `acknowledgeChanges()` which resets the `lastCheckedRef` timestamp and hides the banner. Future changes will re-trigger it.
- **Refresh:** The Refresh button calls `window.location.reload()` to reload the entire app with fresh data.
- **Silent Errors:** Polling errors are silently ignored (connection may be temporarily down) — the next poll cycle will retry.
- **Accessibility:** Banner has `role="alert"` and `aria-live="polite"`. Refresh button has `aria-label="Refresh"`.

### 7.4 Auth Context Pattern
- Two contexts: `AuthStateContext` (user, loading, isAuthenticated) and `AuthActionsContext` (login, register, logout).
- On mount: try `authApi.me()` with stored token to restore session.
- Login/register: store tokens in `localStorage`, set user in context.
- Logout: clear tokens from `localStorage`, clear user, redirect to `/login`.
- `useAuth()` hook combines both contexts into a single consumer.
- Auth context wraps the entire app above route definitions.

### 7.5 Locale Context Pattern
- State: `locale` ('en'|'ar'), `direction` ('ltr'|'rtl'), `translations` (loaded JSON).
- Translations: dynamically imported JSON files on locale change.
- Document: sets `lang` attribute on `<html>` to locale, `dir` attribute to direction.
- Persistence: locale saved to `localStorage`.
- `t()` function: translation lookup with key fallback (returns key if not found).
- Show loading spinner while translations load asynchronously.

---

## 8. i18n & Accessibility

### 8.1 Internationalization
- ALL user-facing strings MUST use `t()` from `useLocale`. Hardcoded strings are FORBIDDEN.
- Translation files MUST be complete — every key in `en.json` MUST exist in `ar.json`.
- New features MUST add translation keys in BOTH `en.json` AND `ar.json`.
- RTL layouts MUST be tested with Arabic content before release.
- Locale MUST be persisted in `localStorage`.
- Use logical CSS properties (margin-inline-start, padding-inline-end, etc.) for RTL support.

### 8.2 Accessibility — WCAG AA Minimum
- ALL form inputs MUST have `<label>` with `htmlFor`.
- ALL images MUST have `alt` attributes.
- Loading states MUST have `role="status"` and `aria-label`.
- Error messages MUST have `role="alert"`.
- Color MUST NOT be the sole means of conveying information (WCAG 1.4.1).
- Color contrast MUST meet 4.5:1 for normal text, 3:1 for large text.
- Interactive elements MUST be keyboard navigable.
- Focus states MUST be visible (focus ring on all interactive elements).
- `aria-busy` on loading buttons, `aria-invalid` on errored inputs, `aria-describedby` linking errors to inputs.

---

## 9. Performance & Resource Management

### 9.1 Memory & CPU
- **Streaming:** Large JSON responses or file uploads/downloads MUST be streamed to prevent high memory consumption.
- **Timeouts:** Every async task and external request MUST have a timeout. Backend: `command_timeout=30` (max 30s). Frontend: Axios timeout 30s.
- **Cleanup:** Frontend `useEffect` MUST return a cleanup function to remove listeners, intervals, or cancel subscriptions to prevent memory leaks.
- **Deduplication:** Prevent concurrent duplicate API fetches via React Query (same query key = single fetch) or Backend locking.
- **React.memo:** Frequently rendered components with stable props MUST be memoized to reduce unnecessary CPU cycles.
- **Component Structure:** Components MUST be strictly modular, focusing on single responsibilities. Reusing existing components is mandatory to avoid codebase bloat.
- **Lazy Loading:** All route pages MUST be lazy-loaded.

### 9.2 Network
- **Axios Retry:** Network error retry with exponential backoff: `min(1000 * 2^attempt, 10000)`, max 3 attempts.
- **Refresh Deduplication:** Only one concurrent refresh request. Subsequent 401s wait for the same refresh promise.
- **React Query Retry:** Default retry 1. Configurable per query.

### 9.4 Storage
- **Image Optimization:** Serve WebP, use responsive sizes, implement lazy loading (`loading="lazy"`).
- **Cache Headers:** Static assets MUST have `immutable` cache headers (1 year).
- **Data Retention:** Regularly archive or prune transient records to optimize disk usage and index speed.

### 9.3 Preloading & Eager Fetching Strategy
- **Global Preloader:** On initial app mount, `AppPreloader` MUST preload all essential queries (users list, events list) with `limit=100` each into the React Query cache behind a full-screen loading spinner.
- **Limit 100:** ALL preload queries MUST be capped at 100 items. This guarantees fast single-request loading (no pagination loops during startup).
- **Complete Before Render:** The preloader MUST NOT render children until all prefetches settle (success or fail). This prevents the "flash of loading skeletons" anti-pattern.
- **staleTime:** Preloaded queries MUST use `staleTime: 30_000` to avoid immediate refetches after the spinner hides.
- **React Query Over Direct Fetch:** Preloading MUST use `queryClient.prefetchQuery()`, never manual `fetch`/`useEffect`+`setState`.

### 9.5 Database Performance
- **Connection Pooling:** `max_size = min(workers * 4, 50)`. Always use the initialized DB pool, never open/close connections per request. Monitor pool exhaustion and tune `min_size` based on baseline traffic.
- **Indexing:** Index every column used in WHERE, JOIN, or ORDER BY clauses. Add composite indexes for common query patterns to satisfy multi-column filtering.
- **Preloading & Eager Fetching:** To prevent N+1 queries, related data MUST be eagerly loaded or joined in the initial query. Batch operations MUST be used when fetching related data for lists. Never query in a loop.
- **No SELECT *:** Always select specific columns. `SELECT *` causes unnecessary memory allocation and network overhead.
- **Partitioning:** High-volume tables (e.g., Events) MUST be partitioned by month range for production to maintain fast inserts and scans.
- **table_changes Cleanup:** `table_changes` log MUST be pruned of records older than 7 days to prevent unbounded growth. Use pg_cron or a scheduled backend task with `DELETE FROM table_changes WHERE changed_at < NOW() - INTERVAL '7 days'`. An index on `changed_at DESC` is REQUIRED.

---

## 10. Observability Rules — 100% Coverage

### 10.1 The Golden Rule
- **Logs + Traces + Metrics:** Required for EVERY operation. NO EXCEPTIONS.
- **Events Table:** ONLY for data where the business needs a permanent audit trail (Golden Question: "Would the business/user care about this record in a year?"). Technical events (login, refresh, API errors) go to logs only — NEVER to events table.

### 10.2 Decision Matrix
| Question | Logs | Traces | Metrics | Events Table |
|----------|:----:|:------:|:-------:|:------------:|
| Is this a code operation? | ✅ Always | ✅ Always | ✅ Always | - |
| Would a user/business care in a year? | ✅ Always | ✅ Always | ✅ Always | ✅ ALSO |

**Examples:**
- User registers → Events table (YES — business audit)
- User logs in → Logs only (NO — high volume, session-level)
- Order placed → Events table (YES — transaction record)
- Token refreshed → Logs only (NO — session management)
- Role changed → Events table (YES — security audit)
- API timeout → Logs only (NO — technical diagnostic)

### 10.3 Logging (structlog)
- ALL requests MUST be logged with: method, path, status, duration_ms, client_ip, request_id.
- Health check, metrics, and docs endpoints MUST NOT be logged (noise reduction).
- All logs MUST be structured JSON in production (`JSONRenderer`), pretty console in dev (`ConsoleRenderer`).
- **PII MUST NEVER appear in logs.** The `redact_pii` processor redacts keys in `SENSITIVE_KEYS`: `password`, `token`, `secret`, `ssn`, `credit_card`, `refresh_token`, `access_token`, `authorization`, `api_key`, `private_key`, `secret_key`.
- Every log line MUST include `request_id` and `trace_id` for correlation (via `structlog.contextvars`).
- Log levels: `INFO` for normal operations, `WARNING` for suspicious/failed attempts, `ERROR` for exceptions.
- Log format in dev: `ConsoleRenderer`. In production: `JSONRenderer`.

### 10.4 Tracing (OpenTelemetry)
- Every boundary-crossing method MUST have `@async_trace` with a descriptive span name (e.g., `"auth_service.register"`, `"orm.postgres.find_by"`, `"event_service.record"`).
- Spans MUST include business context attributes (user_id, entity_id, etc.) via `attributes` parameter.
- `UserIDSpanProcessor` MUST attach `enduser.id` and `actor_id` to every span from context variable.
- Trace sampling: 100% in development, 10% in production (via `ParentBasedSampler(TraceIdRatioBased(0.1))`).
- Trace context MUST propagate to downstream services via HTTP headers.
- Every span MUST record: start time, duration, status (OK/ERROR), and exception details on failure (`span.record_exception(e)`).
- `@observe_db` decorator MUST use actual table name in labels — NEVER hardcode `"dynamic"`.

### 10.5 Metrics (Prometheus)
- Every HTTP request increments `http_requests_total` (labels: method, endpoint, status_code).
- Every HTTP request records `http_request_duration_seconds` (labels: method, endpoint).
- Every DB query increments `db_queries_total` (labels: operation, actual table name).
- Every DB query records `db_query_duration_seconds` (labels: operation, actual table name).
- `auth_failures_total` (labels: reason) tracks authentication failures.
- Histogram buckets MUST be tuned for the service's typical latencies (not Prometheus defaults).
- `/metrics` endpoint is mounted via `make_asgi_app()` and MUST be protected by authentication or IP whitelist in production.
- Slow query logging: log warning for DB queries exceeding 1000ms.

### 10.6 Events Table
- Events table is ONLY for data that passes the Golden Question.
- Service code writes to events table via `event_service.record()`. Middleware MUST NOT.
- Every event record MUST include: `event_type` (dot-notation, e.g., `"auth.register"`), `entity_type`, `entity_id`, `metadata` (JSONB), `severity` (default `"info"`).
- Use `@async_trace("event_service.record")` decorator on all event recording methods.

### 10.8 Notifications on Assignment/State Changes
- Any service method that changes ownership or assignment of a resource to a user (e.g., setting `assigned` field on a complaint) MUST also create a notification for the assignee.
- The `notification_service.create()` call MUST live in the service layer (not the route) so it fires regardless of the caller.
- The notification MUST include: descriptive `title` (e.g., `f"New complaint assigned: JOB-{job_no}"`), descriptive `body`, `type="assignment"`, and the target `user_id`.
- Failed notification creation MUST NOT block the primary operation — wrap in try/except with error logging.
- Notification logic MUST be extracted into a private helper method (e.g., `_notify_assignee()`) for clarity.

### 10.7 Context Variables
- `request_id_var` — Unique request identifier (UUID). Set by `ObservabilityMiddleware`.
- `trace_id_var` — Trace correlation ID (first 8 chars of request_id).
- `user_id_var` — Authenticated user ID. Set by `get_current_user` dependency.
- All three MUST be bound to `structlog.contextvars` for automatic inclusion in every log line.

---

## 11. Error Handling

### 11.1 Backend Error Handling
- **HTTPException:** Caught by global exception handler and returned as JSON: `{"error": {"code": "HTTP_ERROR", "message": exc.detail}}`.
- **Unhandled Exceptions:** Global handler catches all unhandled exceptions, logs full traceback (`logger.exception("unhandled_error", path=...)`), returns 500: `{"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}}`.
- **Rate Limit Exceeded:** Handled by `slowapi` default handler.
- **Payload Too Large:** 413 error with structured JSON body.
- **Invalid Host:** 400 error with structured JSON body.
- **Duplicate Email:** Service layer catches DB exception and returns 409: `{"detail": "Email already registered"}`.
- **Service Errors:** Services raise `HTTPException` with appropriate status codes. Never expose internal details in error messages.

### 11.2 Frontend Error Handling
- **ErrorBoundary:** Class component wrapping the entire app. Catches rendering errors. Shows fallback UI with reload button.
- **React Query Errors:** Every `useQuery`/`useMutation` MUST handle `isError` and `error` states. Display user-friendly error messages (NOT raw error objects).
- **Axios Interceptor:** Handles 401 (refresh attempt + retry, or redirect to login). Network errors: exponential backoff retry.
- **Page-Level:** Every page MUST handle four states: loading (Skeleton), empty (message), error (message + retry), success (data).
- **Form Errors:** Display validation errors inline below fields. Display API errors (e.g., "Email already registered") as general form error.

---

## 12. Testing Rules — 80%+ Coverage

### 12.1 Golden Rule
- **No test = no merge.** Every bug fix, feature, or refactor MUST have tests.
- If tests fail, fix before proceeding. Never push or merge if tests or linter fail.
- Every bug fix MUST include a test that reproduces the bug.

### 12.2 Coverage Targets
| Layer | Minimum Coverage |
|-------|:----------------:|
| Backend (overall) | 80% |
| Backend services + routes | 90% |
| Frontend (overall) | 70% |
| Frontend hooks + contexts | 80% |

### 12.3 Test Structure
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

### 12.4 Fixtures (conftest.py)
- `mock_orm` — Auto-used fixture. In-memory `MockORM` that replaces real DB via `patch` on `get_orm`. MUST support ALL filter operators.
- `app` — FastAPI test application instance.
- `client` — Async HTTP client (`AsyncClient` with ASGI transport).
- `user_payload` — Sample registration data dict.
- `admin_user` — Pre-created admin user in MockORM.
- `customer_user` — Pre-created customer user in MockORM.
- `auth_headers` — JWT auth headers for admin user.
- `customer_auth_headers` — JWT auth headers for customer user.

### 12.5 MockORM Requirements
- MUST be an in-memory dict-based store.
- MUST support ALL QueryBuilder filter operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in_`, `is_null`, `is_not_null`.
- MUST support: `create`, `find_by_id`, `find_by`, `find_one_by`, `update`, `update_by` (with filter guard), `delete`, `delete_by` (with filter guard), `count` (with optional filtered count), `execute_raw`.
- `update_by` and `delete_by` MUST raise error if no filters provided.
- MUST auto-assign UUID `id` if not provided on create.

### 12.6 Factories
- MUST generate unique data per test (randomized emails, unique names).
- **UserFactory:** `.build()`, `.admin()`, `.technician()`, `.member()`, `.customer()`, `.inactive()`, `.build_dict()`.
- **RoleFactory:** `.build()`, `.admin()`, `.technician()`, `.member()`, `.customer()`, `.build_permission(role_id)`.
- **EventFactory:** `.build()`, `.auth_event()`, `.error_event()`, `.build_dict()`.

### 12.7 Test Categories

**Unit Tests (`tests/unit/`):**
- Test single functions/classes in isolation — no API calls.
- Examples: QueryBuilder methods, password hashing, JWT create/decode, RBAC permission checks, observability decorators.
- Cover: success paths, error paths, edge cases.

**Integration Tests (`tests/integration/`):**
- Test API endpoints via `AsyncClient` with MockORM.
- Test: success paths, error paths, auth enforcement, RBAC enforcement, validation, response shapes.
- One test class per endpoint group.
- MockORM MUST test ALL filter operators, not just `eq`.

**E2E Tests (`tests/e2e/`):**
- Test complete user flows: register → login → /me → check permissions → access restricted resource (403) → refresh → new token works.
- Test: unauthorized access blocked, invalid tokens rejected, multiple users register+login.
- Test admin vs customer permission differences.
- **E2E tests MUST pre-login all users before running test sections** to avoid rate limiting (5/minute global limit on `/auth/login`). Cache tokens in a module-level dict and reuse them across tests.
- **CRITICAL E2E test:** When a resource is assigned to a user (e.g., complaint assigned to technician), verify a notification was created for that user by comparing notification count before and after assignment.
- **E2E tests MUST verify RBAC enforcement** — every role is tested against endpoints they should and should not access.
- **E2E tests MUST test pagination** — verify `limit` and `offset` params work and the response shape includes `data`, `total`, `limit`, `offset`.
- **E2E tests MUST test edge cases** — non-existent IDs return 404, invalid enums return 422, duplicate data returns 409.

**Performance Tests (required for critical paths):**
- Login endpoint: 100 concurrent requests.
- User list: paginated response times.
- MUST exist before major releases.

**Security Tests (required):**
- SQL injection attempts on all query parameters.
- XSS attempts on text fields.
- Rate limiting enforcement.
- CORS origin validation.

### 12.8 What to Test Per Feature
1. **Models:** serialization, `to_response()`, `_table()`, model_dump (exclude sensitive fields)
2. **Schemas:** validation (required fields, type checks, custom validators, type coercion)
3. **Services:** business logic (success, error, edge cases), events table decisions
4. **Routes:** status codes, response shape, auth enforcement, RBAC enforcement
5. **RBAC:** permission checks, role hierarchy, access denials, admin bypass
6. **Observability:** decorators work, metrics recorded, logger functions, events table only gets business data (Golden Question pass)
7. **Frontend:** permission helpers, component rendering (loading/empty/error/success), auth state, form validation
8. **Frontend Validation:** All validation functions, type guards, error messages, edge cases (empty, invalid format, type mismatches)
9. **Middleware:** ObservabilityMiddleware metrics counters, RequestLoggingMiddleware structured logging (excludes health)
10. **`update_by`/`delete_by`:** verify error raised when no filters provided
11. **Events:** verify `count_events` respects all filter parameters (entity_type, event_type, actor_id)

### 12.9 Test Isolation & Quality
- Tests MUST NOT depend on external services (real Supabase, Redis, etc.) unless explicitly marked as separate integration tests.
- Test databases MUST be ephemeral — created per session, destroyed after.
- Factories MUST generate unique data per test (randomized emails, unique names).
- Fixtures MUST be stateless and reusable.
- ALL assertions MUST be explicit. Avoid `assert x in (a, b)` when exact status code is known.
- Test assertions MUST match actual API response shapes.
- **Flaky Tests:** MUST be quarantined immediately and fixed within 48 hours. A flaky test not fixed within 48h blocks the release.

### 12.10 Events Table Testing
- **Every operation:** verify logging exists, tracing decorator applied.
- **Business events** (register, payment, role change): verify events table ALSO has a record.
- **Technical operations** (login, refresh, API calls): verify events table has NO record (logs only).
- **Middleware:** verify it NEVER writes to events table — only service code does.

---

## 13. Deployment & CI/CD

### 13.1 Pipeline Stages
1. **Lint** (parallel): `ruff check` (Python) + `eslint` (TypeScript) — any failure blocks pipeline.
2. **Test** (after lint): `pytest` with `--cov-fail-under=80` (Backend) + `vitest run` (Frontend).
3. **Build** (after test): Docker Buildx, build + push images to GHCR with tags `latest` and `${{ github.sha }}`.
4. **Deploy** (on main/release push): SSH to production → run DB migrations → pull new images → `docker-compose up` → smoke test → auto-rollback on failure.
5. **Vercel Deploy** (after deploy): Frontend to Vercel (main/release branches only).

### 13.2 Immutability
- Build once, deploy many. The same Docker image MUST be used for Staging and Production.
- Docker image tags: `latest` for latest stable, `${{ github.sha }}` for specific version.
- **Environment Promotion:** dev → staging → production.

### 13.3 Docker Standards
- **Multi-Stage Build:** Every Dockerfile MUST have `builder` and `runner` stages.
- **Base Images:** Python: `python:3.12-slim`. Node: `node:20-alpine`. Nginx: `nginx:1.27-alpine`.
- **Non-Root User:** `runner` stage MUST create and use a non-root user.
- **HEALTHCHECK:** Every Dockerfile MUST include HEALTHCHECK instruction.
- **.dockerignore:** MUST exclude `.env`, `.venv/node_modules`, `__pycache__`, `*.pyc`, `.git`, tests, `*.md`.

### 13.4 Deployment Targets

**Docker Compose (dev):** `docker-compose.yml` — Backend + Frontend services, shared bridge network. Frontend depends on backend healthy. Env files: `backend.env`, `frontend.env`.

**Docker Compose (prod):** `deploy/docker-compose.prod.yml` — Nginx reverse proxy (port 80/443, SSL volumes) + Backend (expose 8000) + Frontend (expose 80). Uses `../.env`.

**Vercel (frontend):** `frontend/vercel.json` — Framework: Vite. Build command: `npm run build`. Output: `dist`. SPA rewrites: all routes → `/index.html`. Asset cache: immutable, max-age 31536000.

**Render:** `deploy/render.yaml` — Two services: `fullstack-backend` (Python, `uvicorn app.main:app`) and `fullstack-frontend` (static site, publish `./dist`). Health check path: `/api/v1/health`.

**AWS ECS:** `deploy/aws/ecs-task-definition.json` — Launch type: FARGATE. CPU: 512, Memory: 1024 MB. Two containers: backend (port 8000) and frontend (port 80). Secrets via AWS SSM Parameter Store. Log driver: `awslogs`.

**Nginx Reverse Proxy:** `deploy/nginx.conf` — SSL termination, security headers, CSP with `connect-src *.supabase.co`, static file caching, backend proxy `/api/` → `backend:8000`, SPA fallback.

**Nginx SPA:** `frontend/nginx/default.conf` — GZip, security headers, 1y cache for static assets, SPA fallback to `index.html`, `/nginx-health` endpoint.

### 13.5 Deployment Safety
- **Migrations First:** DB migrations MUST run and succeed before the app deployment starts.
- **Smoke Tests:** Automated health check (`/api/v1/health`) MUST run immediately after deployment.
- **Rollback:** Automated rollback to previous version on smoke test failure.
- **Health Check:** Backend health check validates DB connectivity. Returns `{"status": "ok", "app": "...", "version": "...", "environment": "...", "database": "connected"}` when DB is reachable, or `{"status": "degraded", "database": "disconnected"}` when DB is unreachable.

### 13.6 Pre-Push Hooks
The pre-push hook (`.githooks/pre-push`) runs in order:
1. `ruff check .` (backend lint)
2. `pytest` (backend tests)
3. `npm run lint` (frontend lint)
4. `npm test` (frontend tests)
ALL MUST pass before push succeeds.

### 13.7 Dependabot
- Weekly updates for pip, npm, and GitHub Actions.
- Labels: `dependencies/python`, `dependencies/javascript`, `dependencies/github-actions`.
- Ignore React >=19 (template compatibility).

### 13.8 Makefile Command Conventions
| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make dev` | Start all services in dev mode |
| `make build` | Build all services |
| `make test` | Run all tests |
| `make lint` | Run all linters |
| `make format` | Format all code |
| `make clean` | Clean build artifacts |
| `make docker-build` | Build Docker images |
| `make docker-push` | Push Docker images |
| `make db-migrate` | Run database migrations |
| `make deploy` | Deploy to production |

---

## 14. Git & Workflow

### 14.1 Branching & Commits
- **Trunk-Based Development:** Feature branches MUST be short-lived (<3 days).
- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- **Atomic Commits:** One logical change per commit. Do NOT mix formatting, refactoring, and feature changes.

### 14.2 Commit Messages
- Format: `type(scope): description`
- Examples: `feat(auth): add password reset flow`, `fix(api): handle duplicate email gracefully`, `chore(deps): upgrade fastapi to 0.115.0`

---

## 15. Environment & Configuration

### 15.1 Settings Pattern (Backend)
- All configuration inherits from `pydantic-settings` `BaseSettings`.
- `.env.example` files MUST be kept in sync with actual required environment variables.
- Default values for secrets MUST be `None` or empty strings.
- Production startup MUST validate that `SECRET_KEY` is not the default value.
- `ALLOWED_HOSTS` and `CORS_ORIGINS` are comma-separated strings parsed into lists.

### 15.2 Critical Environment Variables
| Variable | Required | Description |
|----------|:--------:|-------------|
| `SECRET_KEY` | ✅ Production | JWT signing secret |
| `DATABASE_URL` | ✅ Production | Full database connection string |
| `JWT_SECRET` | ✅ Production | JWT secret key |
| `ENVIRONMENT` | ✅ | "development", "staging", or "production" |
| `ALLOWED_HOSTS` | ✅ Production | Comma-separated allowed hostnames |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed CORS origins |

### 15.3 Frontend Environment
- `VITE_` prefix required for all frontend env vars exposed to browser.
- `VITE_API_BASE_URL` — Backend API URL.
- `VITE_DEFAULT_LOCALE` — Default locale ('en' or 'ar').
- Type declarations in `vite-env.d.ts` for all VITE_ variables.

---

## 16. RBAC (Role-Based Access Control) — Specifics

### 16.1 Role Hierarchy
```
admin       → ALL permissions (bypass — only hardcoded behavior)
technician  → user:read, content:create/read/update/delete, system:read, event:read
member      → content:read/create/update
customer    → content:read
```

### 16.2 Permission Model
- Source of truth: `permissions` database table (role_id, action, resource).
- Backend `PermissionType` enum MUST be updated when new permissions are added.
- `ROLE_PERMISSIONS` mapping in code is a cache — DB is the source of truth.
- New user default role: `"customer"`.

### 16.3 Backend Enforcement
```python
@router.get("/resource")
async def get_resource(
    current_user = Depends(rbac.require_permission(PermissionType.CONTENT_READ))
): ...
```
- Every new protected route MUST add RBAC dependency.
- **Prefer permission-based** (`require_permission`) over role-based (`require_role`) for fine-grained control.
- NO inline `=== 'admin'` role checks — always use RBAC service/functions.
- `hasRole` checks MUST include admin bypass (admin always passes).

### 16.4 Frontend Enforcement (UX Only)
- `PermissionGate` component: permission-based gating (PREFERRED).
- `RoleGuard` component: role-based gating (use only when whole role category needed).
- `UserRoleBadge` component: display role badge.
- `hasPermission(user, permission)` utility function from `types/role.ts`.
- Frontend RBAC is for UX only — Backend is the real enforcement point.

### 16.5 Permission Completeness Rules
- **Every CRUD operation MUST have its own dedicated PermissionType** — never reuse `READ` for `UPDATE` or `UPDATE` for `DELETE`. Each route's `require_permission()` MUST match the actual CRUD operation.
- **All four CRUD permissions (CREATE/READ/UPDATE/DELETE) MUST exist** in `PermissionType` enum for every entity that supports full CRUD. Missing permissions (e.g., `NOTIFICATION_DELETE` or `ATTENDANCE_REPORT_UPDATE`) are bugs.
- **Role permissions MUST be audited for completeness** — if a role can receive a resource (e.g., notifications), it MUST also have UPDATE permission to manage it (e.g., mark as read).
- **After ANY change to `ROLE_PERMISSIONS`**, the database MUST be re-seeded by running `python -c "from app.utils.seed import seed_roles_and_permissions; import asyncio; asyncio.run(seed_roles_and_permissions())"` — the in-memory mapping is only a fallback; the DB `permissions` table is the source of truth.

---

## 17. AI Collaboration Rules

### 17.1 Verification
- AI MUST run tests after code changes.
- AI MUST verify linter/type-checker compliance.
- AI MUST verify ALL rules in this document are satisfied before considering a task complete.

### 17.2 Documentation
- AI MUST use Google Style docstrings (Python) and JSDoc (TypeScript) for all new functions.
- AI MUST update relevant documentation when adding new features.

### 17.3 Adherence & Template Immutability
- AI MUST strictly adhere to this `RULES.md`. If a requested change violates these rules, the AI MUST flag the violation to the user instead of proceeding.
- **Zero Structural Drift Guarantee:** AI MUST operate strictly within the defined template boundaries. AI MUST NOT alter the core template architecture, structural design, or shared foundational components.
- AI MUST NOT commit `.env` files, secrets, or credentials.
- AI MUST NOT introduce new dependencies without checking existing package managers (`requirements.txt`, `package.json`).
- **Total Compliance:** Any update made by AI MUST satisfy all rules across coding, deployment, testing, e2e integration, and performance to maintain a secure, reliable, fast, and well-structured application.

---

## 17.5 End-to-End Field Alignment

### 17.5.1 Golden Rule
Every field MUST be **100% aligned** across ALL four layers: **Frontend UI → API Schema → Backend Model → Database Column**. No field name, type, required/optional status, or constraint may differ between layers.

### 17.5.2 Alignment Requirements

1. **Field Name Consistency:** The same field MUST use the same semantic name across all layers:
   - **Frontend UI Label:** User-friendly (e.g., "First Name")
   - **Frontend TypeScript:** camelCase (e.g., `firstName`)
   - **API / Backend / Database:** snake_case (e.g., `first_name`)

2. **Field Type Consistency:** Compatible types across all layers:
   - **Frontend Input Type → TypeScript type → Pydantic type → DB column type** MUST be compatible
   - Example: `type="email"` → `string` → `str` → `TEXT` (with email CHECK constraint)

3. **Required/Optional Consistency:** A field's required/optional status MUST be identical at every layer:
   - Frontend `required` attribute → Frontend validation → API schema (required/Optional) → DB (NOT NULL / nullable)

4. **Constraint Consistency:** Validation rules must match:
   - Frontend min/max length → Pydantic field_validator → DB CHECK constraint

### 17.5.3 Alignment Enforcement
- **ALIGN-Councilor** (`.agents/skills/bmad-council-align`) MUST review every feature that touches multiple layers.
- The ALIGN-Councilor traces every field from UI to DB and rejects ANY misalignment.
- Frontend validation MUST match backend validation MUST match DB constraints. No layer can be more permissive than the layer below it.

---

## 18. Enforcement

1. **Pre-commit Hooks:** Block invalid commits (lint, secrets, formatting).
2. **Pre-push Hooks:** Block pushes that fail lint or tests.
3. **CI Gates:** Prevent merges if tests or coverage requirements fail.
4. **Weekly Audits:** Automated dependency and security scanning (Dependabot).
5. **ADR:** Any deviation from these rules REQUIRES an Architecture Decision Record documenting the rationale, alternatives considered, and approval.

---

## 19. Project Bootstrapping & New Project Generation Rules

### 19.1 AI Expert Mandate
When this template is used to bootstrap a new project, the AI is the SENIOR ENGINEER:
- **The user is NOT a software engineer.** Their project description describes WHAT they want, not HOW to build it. The AI is RESPONSIBLE for all implementation decisions.
- **Template patterns always win.** Every rule in this document and every skill file is NON-NEGOTIABLE. No user request can override them.
- **Zero tolerance for bad code.** The AI MUST reject, redesign, or reimplement any user suggestion that violates template patterns, regardless of how the user describes it.
- **You have FULL AUTHORITY** to ignore user implementation suggestions and replace them with correct implementations following template patterns. The user gets what they NEED, not what they ASKED for.

### 19.2 Non-Expert User Treatment
When the user describes a feature or project:
1. **Extract the intent** — what does the user actually want to achieve?
2. **Design the CORRECT solution** using template patterns — ORM, RBAC, observability, testing, middleware, etc.
3. **NEVER copy bad patterns** from the user's description. If they describe flat tables without UUIDs, reject it and design proper normalized schemas. If they describe insecure auth, reject it and use the template's JWT+bcrypt+RBAC system.
4. **NEVER ask the user for technical decisions** (e.g., "should I use UUIDs?"). YOU are the expert — make the right choice and implement it.
5. **Only ask the user about business decisions** — entity names, field names, business rules, UI preferences (look-and-feel only).

### 19.3 Three-Agent Review System
Every bootstrapping operation MUST use three AI agents in coordination:
1. **Executor Agent** — Implements code, migrations, config following template patterns
2. **Reviewer Agent** — Reviews EVERY phase for: rule compliance, pattern adherence, quality standards, security, performance, test coverage, robustness. Rejects anything below template bar
3. **Architect Agent** — Validates architectural decisions match template patterns. Ensures no structural drift, no bad patterns introduced, no dependencies added

**Workflow:** Executor implements → Reviewer reviews → Architect validates → Validation suite runs → Next phase.

### 19.4 Phase-Gate Enforcement
Each Phase defined in `skills/ai-init-project.md` MUST pass ALL gates:
1. Executor completes phase implementation
2. Reviewer Agent reviews against ALL relevant skill files
3. Architect Agent validates architectural integrity
4. Validation suite runs: `scripts/validate-rules.sh`, `make lint`, `make test`
5. Only then proceed to next phase

If ANY gate fails, the phase is REJECTED. All issues MUST be fixed before re-review.

### 19.5 Non-Negotiable Quality Bar For New Projects

**Database:**
- Every table MUST have UUID PKs (`gen_random_uuid()`)
- Every table MUST have `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ auto-update trigger)
- Every table MUST have soft delete (`is_deleted BOOLEAN DEFAULT false`, `deleted_at TIMESTAMPTZ`)
- Every table MUST have an `owner_id` FK to `users(id)` where applicable
- RLS MUST be enabled on all tables
- Every mutable table MUST have `notify_table_change` trigger
- Schema MUST be normalized to at least 3NF
- All appropriate indexes MUST exist (WHERE, JOIN, ORDER BY columns)
- Composite indexes MUST exist for common query patterns
- Junction tables for M:N relationships MUST exist where needed

**Backend:**
- Every entity MUST have: model, schema (Create/Update/Response), service, route
- Every service method MUST have `@async_trace` decorator
- Every route MUST have RBAC enforcement via `require_permission`
- Every route MUST declare `response_model`
- List endpoints MUST support pagination (limit/offset)
- Every operation MUST have structured logging
- Error responses MUST follow: `{"error": {"code": "...", "message": "..."}}`

**Frontend:**
- Every entity MUST have: TypeScript types, API client, React Query hooks, List/Detail/Form pages
- Every page MUST be lazy-loaded with `React.lazy()` + `Suspense`
- Every form MUST use `react-hook-form` + `zod`
- Every page MUST handle: loading (Skeleton), empty, error (with retry), success states
- Every component MUST support dark mode (`dark:` Tailwind variants)
- Every page MUST be fully responsive (320px–1440px+)
- ALL user-facing strings MUST use `t()` from `useLocale`
- ALL a11y requirements (WCAG AA) MUST be satisfied

**Testing:**
- Every entity MUST have: service unit tests, API integration tests, frontend hook tests, component tests
- Backend coverage: 80% overall, 90% services+routes
- Frontend coverage: 70% overall, 80% hooks+contexts
- No test = no merge. No exceptions.

**Security:**
- ALL rules in §1 MUST be satisfied
- No SQL injection, no secrets in code, no hardcoded credentials
- JWT with proper claims, bcrypt cost >= 12, rate limiting on auth endpoints
- Security headers on all responses
- Input validation on ALL user input

**Observability:**
- EVERY operation: logging + `@async_trace` tracing
- Golden Question determines events table usage
- Prometheus metrics on HTTP requests and DB queries

**CI/CD & Deployment:**
- Docker multi-stage builds with non-root user
- HEALTHCHECK on every container
- CI pipeline: lint → test → build → deploy
- Database migrations run before deployment
- Smoke tests after deployment

---

## 20. New Feature Implementation Rules

### 20.1 Adding Features to a Bootstrapped Project
When adding features to a project derived from this template:
1. Follow the same quality bar as §19.5
2. Follow the exact patterns in `skills/ai-init-project.md` Appendices A and B
3. Create ALL required files: model, schema, service, route, types, API client, hooks, pages, i18n keys, tests
4. Update: ORM `VALID_COLUMNS`, `PermissionType` enum, `ROLE_PERMISSIONS`, route registration, AppPreloader
5. Register routes in `backend/app/api/v1/__init__.py` and `backend/app/main.py`
6. Register models/schemas in their respective `__init__.py`
7. Add i18n keys in BOTH `en.json` and `ar.json`
8. Add navigation links in Header with `PermissionGate`
9. Add preloads in AppPreloader
10. Write tests for ALL layers

### 20.2 Quality Review
Every new feature MUST be reviewed against:
- ALL rules in this document
- ALL relevant skill files
- Test coverage targets (§12)
- Security requirements (§1)
- Observability requirements (§10)
- Performance requirements (§9)

---

*Last Updated: 2026-05-15*
*Version: 3.2.0 — Added ALIGN councilor, HS256-only auth, frontend validation hardening, user-friendly naming, search validation, end-to-end field alignment rules.*
