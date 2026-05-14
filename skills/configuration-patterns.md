# Environment & Configuration

> **Source of Truth:** This skill defines ALL configuration rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 15.1 Settings Pattern (Backend)

- All configuration inherits from `pydantic-settings` `BaseSettings`.
- `.env.example` files MUST be kept in sync with actual required environment variables.
- Default values for secrets MUST be `None` or empty strings.
- Production startup MUST validate that `SECRET_KEY` is not the default value.
- `ALLOWED_HOSTS` and `CORS_ORIGINS` are comma-separated strings parsed into lists.

---

## 15.2 Critical Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `SECRET_KEY` | ✅ Production | JWT signing secret |
| `DATABASE_URL` | ✅ Production | Full database connection string |
| `JWT_SECRET` | ✅ Production | JWT secret key |
| `ENVIRONMENT` | ✅ | "development", "staging", or "production" |
| `ALLOWED_HOSTS` | ✅ Production | Comma-separated allowed hostnames |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed CORS origins |
| `PASSWORD_RESET_BASE_URL` | ✅ | Base URL for password reset links (prevents Host Header Injection) |

---

## 15.3 Frontend Environment

- `VITE_` prefix required for all frontend env vars exposed to browser.
- `VITE_API_BASE_URL` — Backend API URL.
- `VITE_DEFAULT_LOCALE` — Default locale ('en' or 'ar').
- Type declarations in `vite-env.d.ts` for all VITE_ variables.

---

## Fail-Safe Configuration

- Default values for secrets in `Settings` MUST be `None` or empty strings, triggering a startup error if missing in non-dev environments.
- Production startup MUST validate that `SECRET_KEY` is not the default value.
