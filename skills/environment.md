# Environment Skill (Vercel + Supabase Stack)

**Description:** Patterns for managing environment variables, secrets, `.env` files, and validation.
**Role:** The Architect / The Reviewer

## 1. Environment Variable Categories

| Prefix | Access | Example |
|--------|--------|---------|
| `NEXT_PUBLIC_` | Client + Server | `NEXT_PUBLIC_SUPABASE_URL` |
| No prefix | Server only | `DATABASE_URL` |
| `SENTRY_` | Server only | `SENTRY_DSN` |

### Critical Rule

Variables WITHOUT `NEXT_PUBLIC_` prefix MUST NEVER be used in `"use client"` files. They are only available in Server Components, API routes, and `next.config.ts`.

## 2. `.env` Files

| File | Purpose | Git? |
|------|---------|------|
| `.env.example` | Documentation template | YES |
| `.env.local` | Local development values | NO |
| `.env.production` | Production overrides | NO |

### `.env.example` Template

```bash
# ---- App ----
NEXT_PUBLIC_APP_NAME=my-app
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ---- Supabase ----
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ---- Database ----
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# ---- Observability ----
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

## 3. Vercel Environment Variables

In Vercel project settings, configure:

- **Production:** `DATABASE_URL` pointing to Supabase transaction pooler (port 6543)
- **Preview/Staging:** Separate Supabase project with its own `DATABASE_URL`
- **Development:** Local Supabase instance

## 4. Runtime Validation

Check required variables at startup:

```typescript
// src/lib/env.ts
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL',
] as const;

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});
```

## Validation Checklist

- [ ] All required env vars documented in `.env.example`
- [ ] No secrets exposed to client (`NEXT_PUBLIC_` rules followed)
- [ ] Production `DATABASE_URL` uses port 6543 (pooler)
- [ ] Vercel env vars configured for all environments
- [ ] Runtime validation exists for required vars
- [ ] `.env.local` in `.gitignore`
