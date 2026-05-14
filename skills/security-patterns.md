# Security Rules — Zero Tolerance

> **Source of Truth:** This skill defines ALL security rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 1.1 SQL Injection

- **Parameterization:** NEVER use f-strings or string concatenation for SQL queries. ALL dynamic values MUST use parameterized queries (`$1`, `$2`, ...).
- **Pagination Safety:** `LIMIT` and `OFFSET` MUST be passed as query parameters, NOT interpolated.
- **Raw SQL Audit:** `execute_raw` MUST only be used for read-only operations in migrations and MUST include a `reason` parameter documenting the need.

---

## 1.2 Secrets & Credentials

- **No Hardcoding:** API keys, secrets, DB URLs, or tokens MUST NEVER be in source code.
- **Fail-Safe Config:** Default values for secrets in `Settings` MUST be `None` or empty strings, triggering a startup error if missing in non-dev environments.
- **Git Safety:** `.env` files MUST be ignored. Pre-commit hooks MUST block commits containing secrets or `.env` files.
- **Supabase Key Separation:** Service role key (`SUPABASE_SERVICE_ROLE_KEY`) MUST be used for write operations only. Anon key (`SUPABASE_ANON_KEY`) MUST be used for read operations.

---

## 1.3 Authentication & Authorization

### Token & JWT Standards
- **JWT Standards:** Tokens MUST include `iat`, `exp`, `sub`, `jti`, and `type` (access/refresh) claims.
- **Algorithm:** Support RS256 with HS256 fallback. Algorithm MUST be configurable via `JWT_ALGORITHM`.
- **Expiration:** Access tokens: max 15 mins (`JWT_ACCESS_TOKEN_EXPIRE_MINUTES`). Refresh tokens: max 7 days (`JWT_REFRESH_TOKEN_EXPIRE_DAYS`).
- **Rotation:** Refresh tokens MUST be rotated on every use; old tokens MUST be invalidated.
- **Reuse Detection:** If a used refresh token is presented again (`is_refresh_used` returns true), ALL user tokens MUST be revoked immediately (`revoke_all_user_tokens`). This signals token theft.
- **Blacklist:** Token `jti` MUST be blacklisted in Redis on logout. Every authenticated request MUST check `is_blacklisted(jti)`.
- **Optional Auth:** Use `get_optional_user` dependency for endpoints that work with or without authentication (returns `None` if no valid token).
- **JWT Storage:** Access tokens MUST be stored in **HTTP-only cookies** (not localStorage or sessionStorage) to prevent XSS exfiltration.

### Comprehensive Authentication Rules
- **Full authentication rules** are in [`skills/authentication-patterns.md`](authentication-patterns.md). Key highlights enforced here:
  - **Bcrypt:** Use `bcrypt` (cost >= 12) for password hashing via `passlib`.
  - **Password Policy:** Minimum 8 characters (with MFA) / 15 characters (without MFA). Maximum: at least 64. Enforced at service layer.
  - **Account Lockout:** Rate limit login endpoints (5 attempts/min per account). Implement account lockout after 10 failed attempts. Lockout MUST be per-account, not per-IP.
  - **Generic Error Messages:** ALL auth endpoints (login, register, password reset) MUST return generic messages. NEVER reveal whether an account exists. NEVER use "quick exit" patterns that create timing discrepancies.
  - **MFA:** MUST be supported as an optional but encouraged security layer.
  - **Breached Passwords:** MUST be blocked via Pwned Passwords API or equivalent.
  - **Strength Meter:** MUST be displayed during registration and password change (zxcvbn).

### Comprehensive Authorization Rules
- **Full authorization rules** are in [`skills/authorization-patterns.md`](authorization-patterns.md). Key highlights enforced here:
  - **Deny by Default:** Access is denied unless explicitly granted. NEVER rely on framework defaults.
  - **Permissions on EVERY request:** Globally applied middleware. One missed check = vulnerability.
  - **IDOR Prevention:** Every object access MUST validate ownership. UUIDs are NOT a substitute for access control.
  - **Server-Side Only:** Client-side checks are for UX only. Backend is the definitive enforcement point.
  - **Least Privilege:** Users get minimum permissions. Review periodically for privilege creep.

### RBAC
- Permissions MUST be database-driven (`permissions` table), not hardcoded. Frontend checks are for UX only; the Backend MUST independently enforce permissions on every sensitive request.
- See [`skills/rbac-patterns.md`](rbac-patterns.md) for detailed RBAC implementation rules.

---

## 1.4 API Security

### Security Headers
Every response MUST include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production only)

### Rate Limiting
- Global rate limit (100 req/min per IP) enforced via `slowapi`.
- Login: 5/min. Register: 10/min. Refresh: 20/min.

### Validation & Sanitization
- ALL user input MUST be validated using Pydantic (Backend) and Zod (Frontend).
- Sanitize all user-provided text with `bleach.clean(text, tags=[], strip=True)` before DB insertion.

### Body Size Limit
- Maximum request body size: 10MB. Enforced via middleware returning 413 `{"error": {"code": "PAYLOAD_TOO_LARGE", "message": "Request body too large"}}`.

### Host Validation
- Validate `Host` header against `ALLOWED_HOSTS`. Return 400 `{"error": {"code": "INVALID_HOST", "message": "Invalid host header"}}` on mismatch.

### CORS
- Configured via `CORSMiddleware` with `allow_origins` from `CORS_ORIGINS` env var, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`.

---

## 1.5 Database Security

### Network & Transport Layer
- **Encrypted connections:** The database client MUST connect using TLS. Configure `sslmode=require` (or equivalent) in connection strings. Verify the server certificate against a trusted CA where possible (e.g., `sslmode=verify-full`).
- **Isolation:** The database SHOULD bind to localhost or a private network interface. If not using a managed cloud DB, restrict network access to the DB port via firewall rules.
- **Thick clients:** Front-end/desktop applications MUST NEVER connect directly to the backend database. All database access MUST go through the API layer, which enforces authentication and authorization.

### Authentication & Credentials
- **No hardcoded credentials:** Database credentials MUST NOT be embedded in source code (see §1.2). Use environment variables or a secrets manager at runtime.
- **Dedicated accounts:** Each application or service MUST use its own database account. Do not reuse credentials across different applications.
- **Least privilege:** The application's database account MUST have only the minimal permissions required (typically `SELECT`, `INSERT`, `UPDATE`, `DELETE` on specific tables). NEVER use the database owner/admin account (`root`, `sa`, `postgres` admin) for application connections.

### Configuration & Hardening
- **Default accounts removed:** All default databases and accounts from the DB installation MUST be removed (e.g., MySQL `test` database, PostgreSQL default `postgres` role if not needed).
- **Service user:** The database server process MUST run under a low-privileged operating system user (not root/admin).
- **Backups:** Database backups MUST be performed regularly. Backups MUST be encrypted and stored with restricted permissions.
- **Patches:** Security updates and patches for the database server MUST be applied promptly.
- **Management tools:** Any web-based database management tools (phpMyAdmin, pgAdmin, etc.) MUST be protected with strong authentication, HTTPS, and network access restrictions.

- Pre-commit hooks block secrets and `.env` files.
- Security tests (SQL injection, XSS, rate limiting, CORS validation) are REQUIRED before major releases.
- Dependabot runs weekly security scans for pip, npm, and GitHub Actions dependencies.
