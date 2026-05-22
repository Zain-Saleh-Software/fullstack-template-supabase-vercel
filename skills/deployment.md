# Deployment Skill (Vercel + Supabase Stack)

**Description:** Patterns for setting up Vercel deployment, configuring CI/CD, connecting Supabase in production, managing environments, and troubleshooting deployment issues.
**Role:** The Architect / The Executor

---

## 1. Vercel Project Setup

### Initial Setup
1. Push the project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → "New Project"
3. Import the GitHub repository
4. Vercel auto-detects Next.js — no configuration needed
5. Configure environment variables (see below)
6. Deploy

### vercel.json

The template includes a minimal `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "regions": ["iad1"]
}
```

- `framework: "nextjs"` — Vercel uses its native Next.js builder
- `regions` — Deploy to US East (iad1); change to a region closer to your users
- No Docker, no custom servers, no NGINX — Vercel handles everything natively

---

## 2. Environment Variables Per Environment

### Local Development (.env.local)

```bash
NEXT_PUBLIC_APP_NAME=my-app
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Production (Vercel Dashboard)

```bash
# App
NEXT_PUBLIC_APP_NAME=My App
NEXT_PUBLIC_APP_URL=https://my-app.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...

# Database — MUST use pooler port 6543
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[DB-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Sentry (optional)
SENTRY_DSN=https://xxxx@sentry.io/xxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxx@sentry.io/xxxx

# Sentry Release Management
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=sntrys_xxxx
```

### CRITICAL: DATABASE_URL in Production

- Local Supabase: port `54322`
- Production Supabase: port `6543` (transaction pooler)
- Direct connection (port `5432`) will fail on Vercel due to connection limits
- The pooler manages connections for serverless environments

---

## 3. CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) handles:

### On Push to develop/main:
1. **Validate** — Lint, type check, tests, coverage
2. **Deploy Staging** — Auto-deploys `develop` to Vercel preview (if Vercel secrets configured)
3. **Deploy Production** — Auto-deploys `main` to Vercel production + runs DB migrations + creates Sentry release

### Required GitHub Secrets

For the CI/CD pipeline to work fully:

```
VERCEL_TOKEN           # Vercel personal access token
VERCEL_ORG_ID          # Vercel organization ID
VERCEL_PROJECT_ID      # Vercel project ID
DATABASE_URL_STAGING   # Staging Supabase pooler URL
DATABASE_URL_PRODUCTION # Production Supabase pooler URL
SENTRY_AUTH_TOKEN      # Sentry auth token for release tracking
SENTRY_ORG             # Sentry organization slug
SENTRY_PROJECT         # Sentry project slug
```

Without Vercel/Sentry secrets, CI/CD still runs validation (lint/test) but skips deployment.

---

## 4. Supabase Production Setup

### Connection Pooler
1. In Supabase Dashboard → Project Settings → Database
2. Under "Connection Pooling" → copy the "Transaction" connection string
3. Note: port is `6543`, not `5432`
4. Use this as `DATABASE_URL` in Vercel

### RLS Policies
- RLS policies defined in `drizzle/0001_custom_rls_and_triggers.sql` are SQL-only
- They must be executed in Supabase SQL Editor (they don't auto-apply via Drizzle)
- Run migrations: `npm run db:push`
- Then manually apply RLS SQL in Supabase Dashboard → SQL Editor

### Auth Configuration
- Supabase Auth callback URLs must include your Vercel domain:
  - `https://my-app.vercel.app/**`
  - `https://my-app.vercel.app/api/auth/callback`
- Configure in Supabase Dashboard → Authentication → URL Configuration

---

## 5. Build Verification

Before deploying, always verify:

```bash
npm run lint         # ESLint + TypeScript — must pass with zero errors
npm run typecheck    # Alternative: npx tsc --noEmit
npm run test         # All tests must pass
npm run build        # Next.js production build must succeed
```

Vercel runs these same checks during deployment. Fix locally first.

---

## 6. Deployment Flow

### Standard Flow (develop → staging)
1. Commit changes on `develop`
2. Push: `git push origin develop`
3. CI/CD auto-deploys to staging (Vercel preview)
4. Test staging deployment

### Production Flow (develop → main PR)
1. Ensure all changes are tested on staging
2. Create PR: `develop` → `main`
3. CI/CD validates the PR
4. Merge PR
5. CI/CD deploys to production + runs migrations + creates Sentry release

---

## 7. Troubleshooting

### Build fails on Vercel but works locally
- Check that all environment variables are set in Vercel dashboard
- Verify `DATABASE_URL` uses pooler port 6543 (not 5432 or 54322)
- Check Vercel build logs for specific error
- Common issue: `NEXT_PUBLIC_*` vars missing or wrong values

### Database connection fails in production
- Verify you're using the transaction pooler URL (port 6543)
- Check that Supabase project is active (not paused)
- Verify IP allowlist includes Vercel's IP ranges
- Run `npm run db:push` from CI/CD or manually against production

### API routes return 500 in production
- Check Vercel function logs
- Ensure `SENTRY_DSN` is valid (syntax errors in Sentry config can crash routes)
- Verify database connection works from Vercel
- Check that RLS policies are applied in production

### Images not loading
- Ensure Supabase storage bucket URLs are in `next.config.ts` `images.remotePatterns`
- Verify bucket is public or has proper access policies

---

## 8. Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Authentication works (login, register, logout)
- [ ] API routes respond correctly
- [ ] Database operations work (CRUD on all entities)
- [ ] RLS policies are enforced
- [ ] Sentry captures errors (if configured)
- [ ] Environment-specific configs are correct
- [ ] SSL/TLS is active (Vercel handles this automatically)
- [ ] Custom domain configured (if applicable)

---

## 9. Rollback Procedure

If a deployment causes issues:
1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Vercel instantly rolls back to that deployment
5. Fix the issue on `develop` branch
6. Re-deploy after fix is verified

---

## Validation Checklist

- [ ] Vercel project connected to GitHub repository
- [ ] All environment variables configured per environment
- [ ] `DATABASE_URL` uses pooler port 6543 in production
- [ ] Supabase Auth callback URLs configured for Vercel domain
- [ ] RLS policies applied in Supabase SQL Editor
- [ ] Build succeeds locally (`npm run build`)
- [ ] CI/CD pipeline passes (lint, test, build)
- [ ] Staging deployment verified
- [ ] Production deployment verified (if applicable)
- [ ] Sentry configured and capturing errors (if enabled)
- [ ] Rollback procedure documented and tested
