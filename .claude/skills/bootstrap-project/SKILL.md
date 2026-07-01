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
3. Map every source entity, permission, and route to the corresponding template patterns.
4. Rename the project from `fullstack-template` to the source project name across all relevant files.
5. Present the migration plan to the user — entities, routes, pages, data volume, risks, strategy. **Get explicit approval before proceeding.**

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

- Set up Vercel project — connect repo, configure env vars, deploy preview.
- Set up production Supabase — apply migrations, data migration, RLS, auth config.
- Deploy to production via PR from `develop` → `main`.
- Run post-deployment smoke tests.

**Validate:** Production URL loads. Auth works. APIs respond.

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
