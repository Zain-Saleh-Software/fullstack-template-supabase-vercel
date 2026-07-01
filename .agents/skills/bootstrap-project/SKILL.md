---
name: bootstrap-project
description: 'Complete AI workflow for migrating an existing project (any tech stack, any state) into this Vercel + Supabase template. Handles database migration, data preservation, 1:1 UI replication, feature parity, auth migration, integration mapping, testing, and deployment.'
---

# Bootstrap Project — Full Project Migration Workflow

Migrate an existing project into this template. Consult the referenced skills for how to implement each phase; follow RULES.md for all architectural and code standards.

---

## PHASE 0: DISCOVERY & APPROVAL

Before writing any code:

1. Accept the source — a local path, git URL, project description, or PRD.
2. Produce a comprehensive inventory: tech stack, databases, APIs, frontend pages, auth system, env vars, business logic.
3. **Credential discovery:** Scan the source project for existing credentials, connection strings, API keys, and environment variable files (`.env`, `.env.local`, `.env.production`, `vercel.json`, `supabase/config.toml`, etc.). Identify:
   - Vercel project IDs, org IDs, tokens
   - Supabase project refs, access tokens, anon/service role keys, database URLs
   - Third-party API keys (Stripe, Resend, Sentry, etc.)
   - Any other integration credentials found in the source
4. **Check user-provided credentials:** If the user included credentials or connection info in their initial prompt, incorporate those and note which are already covered.
5. Map every source entity, permission, and route to the corresponding template patterns.
6. Rename the project from `fullstack-template` to the source project name across all relevant files.
7. Present the migration plan to the user — entities, routes, pages, data volume, risks, strategy, and a summary of credentials found vs. still needed. **Get explicit approval before proceeding.**

---

## PHASE 1: DATABASE MIGRATION

> **Skills:** `database.md`  
> **Councils:** Database Council, Security Council

- Remove POC entities; define Drizzle schemas for every source entity.
- Generate and apply migrations.
- Create an idempotent data migration script with zero data loss.
- Generate RLS policies for every entity table.
- Update seed script with project-specific roles and permissions.

**Validate:** Migrations applied, data row counts match, RLS in place.

---

## PHASE 2: AUTH & RBAC MIGRATION

> **Skills:** `auth-rbac.md`, `environment.md`  
> **Councils:** Security Council, Architect Council

- Migrate all users to Supabase Auth.
- Map source roles and permissions to template RBAC.
- Configure Supabase Auth settings.

**Validate:** All auth flows work. RBAC fully mapped.

---

## PHASE 3: API ROUTE MIGRATION

> **Skills:** `api-design.md`, `error-handling.md`, `typescript.md`  
> **Councils:** API Design Council, Security Council, Quality Council, Testing Council

- Map every source endpoint to template API routes.
- Create Zod validation schemas for every entity.
- Implement all routes following the patterns in `api-design.md`.
- Handle non-CRUD endpoints (search, bulk, file uploads, webhooks).
- Preserve response shapes if external API consumers exist.

**Validate:** All endpoints match source behavior. Permissions enforced.

---

## PHASE 4: FRONTEND MIGRATION

> **Skills:** `frontend.md`, `i18n.md`, `accessibility.md`, `error-handling.md`, `seo-metadata.md`, `code-quality.md`  
> **Councils:** Frontend Council, Quality Council, Architect Council

- Map every source page to the template route structure.
- Migrate all UI components following `frontend.md` and `accessibility.md`.
- Convert state management and data fetching to template patterns.
- Migrate all forms to template conventions.
- Migrate i18n following `i18n.md`.
- Add loading states, error boundaries, empty states, and SEO metadata.
- Audit accessibility per `accessibility.md`.

**Validate:** UI visually identical to source. All states covered. RTL and dark mode work.

---

## PHASE 5: INTEGRATION MIGRATION

> **Skills:** `deployment.md`, `observability.md`, `environment.md`  
> **Councils:** Deployment Council, Observability Council

- Map every third-party integration to template-compatible implementations.
- Document all environment variables. Follow env var security rules.
- Configure observability following `observability.md`.

**Validate:** All integrations functional. Env vars documented.

---

## PHASE 6: TESTING

> **Skills:** `testing.md`  
> **Councils:** Testing Council, Quality Council

- Migrate existing source tests.
- Add schema shape tests and API route tests for every entity.
- Meet all coverage thresholds from `testing.md`.

**Validate:** `npm run test` passes. Coverage meets thresholds.

---

## PHASE 7: VALIDATION & POC CLEANUP

> **Skills:** `poc-cleanup.md`, `code-quality.md`  
> **Councils:** Lead Council (orchestrates all 11 councils)

- Run every council review.
- Remove all POC artifacts per `poc-cleanup.md`.
- Verify immutable files untouched.
- Run full build verification: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
- User acceptance testing on preview deployment.

**Validate:** All councils approved. All POC removed. All builds pass.

---

## PHASE 8: DEPLOYMENT

> **Skills:** `deployment.md`  
> **Councils:** Deployment Council, GitHub Council

**CRITICAL RULE: NEVER create new infrastructure.** Connect to the user's EXISTING Vercel project, Supabase project, and third-party services. Do NOT provision new databases, new Vercel projects, or new Supabase instances. If credentials for an existing service are missing, ask the user.

### Credential Resolution Strategy (in priority order)

1. **Source project discovery (Phase 0):** Use credentials found by scanning the source project's `.env` files, config files, and code. These were already identified during discovery.
2. **User-provided in initial prompt:** Use any credentials or connection info the user gave when starting the bootstrap. These take precedence over discovered credentials.
3. **Ask the user now:** If any required credential is still missing when this phase begins, **stop and ask the user**. List exactly what's needed and why.

### What to Ask For (if missing)

| Service | Required Credentials | Where to Find Them |
|---------|---------------------|-------------------|
| **Vercel** | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | [Vercel Account Settings → Tokens](https://vercel.com/account/tokens) and Project Settings |
| **Supabase** | `SUPABASE_ACCESS_TOKEN`, Supabase Project Ref (`SUPABASE_PROJECT_ID`), Database URL (`DATABASE_URL`), Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) | [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard) and [Access Tokens](https://supabase.com/dashboard/account/tokens) |
| **Sentry** | `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` | [Sentry Settings → API Keys](https://sentry.io/settings/account/api/auth-tokens/) and Project Settings |
| **Stripe** | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, Stripe Webhook Secret | Stripe Dashboard → Developers → API Keys |
| **Resend** | `RESEND_API_KEY` | Resend Dashboard → API Keys |
| **Other** | Any additional keys the source project used | Per-service documentation |

### Deployment Steps

- **Connect to existing Vercel project** using the provided/collected `VERCEL_TOKEN`, org ID, and project ID. Configure all environment variables from the collected set. Do NOT create a new project.
- **Connect to existing Supabase project** using the provided/collected `SUPABASE_ACCESS_TOKEN` and project ref. Apply migrations, data migration, RLS policies, and auth configuration to the existing project. Do NOT create a new project.
- Push code to the connected repository.
- Deploy via existing Vercel pipeline.
- Run post-deployment smoke tests against the existing production URL.

**Validate:** Production URL loads. Auth works against existing Supabase project. All APIs respond. All third-party integrations functional.

---

## SUCCESS CRITERIA

Migration is complete when:

- Every source feature, API endpoint, and page works identically in the template.
- Zero data loss.
- UI visually identical, no regressions.
- All POC code removed. Immutable files untouched.
- All councils approved. All skills consulted.
- `npm run lint`, `typecheck`, `test`, and `build` all pass.
- Deployed and working in production.

---

## CONCLUSION CHECKLIST

After all phases, report back:

1. Summary — entities, routes, pages migrated.
2. Data — row counts confirmed.
3. Key patterns to know.
4. Next steps for the user.
5. Key commands.
6. Push to `develop`, PR to `main`.
