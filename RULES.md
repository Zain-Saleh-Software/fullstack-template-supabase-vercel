# Template Rules

> **Source of Truth:** This file defines the EXACT architectural, structural, and operational rules for this Next.js + Supabase template.
> **Compliance:** Mandatory for every project bootstrapped from this template.
> **Deviation:** Forbidden unless the user explicitly overrides a rule.

## 1. Technology Stack (Immutable)

The stack is frozen and strictly non-negotiable to maintain consistency across all CRM/HR projects.

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, `clsx` + `tailwind-merge` |
| **Backend** | Next.js API Routes (Route Handlers) |
| **Database** | Supabase PostgreSQL, Drizzle ORM |
| **Authentication**| Supabase Auth (Server & Client SDKs) |
| **State** | TanStack Query (Server state), Context API (Local) |
| **Forms** | `react-hook-form` + `zod` |
| **i18n** | `next-intl` (Middleware + SSR) |
| **Observability** | Vercel Analytics + Sentry + custom structured logger |
| **Deployment** | Vercel (Frontend/API) + Supabase (DB/Auth) |

## 2. Next.js App Router Rules

1. **Server vs Client Components:** Default to Server Components (`export default async function`). Use `"use client"` only when necessary (hooks, interactivity, React Query providers).
2. **Data Fetching:** Prefer Server Components fetching directly from Drizzle ORM. Use React Query in Client Components only for mutations or highly dynamic polling.
3. **API Routes:** All REST endpoints must reside in `src/app/api/v1/`. They must use the `requirePermission` helper and return standardized responses via `paginatedResponse` or `apiError`.
4. **Middleware:** `src/middleware.ts` MUST handle both `next-intl` locale routing and Supabase session refreshing.

## 3. Database & ORM Rules

1. **Drizzle Only:** All database interactions MUST use Drizzle ORM (`src/lib/db/`). No raw SQL unless using `drizzle.execute(sql\``...`\`)`.
2. **Schema:** All schemas live in `src/lib/db/schema/index.ts`. All tables MUST be `pgTable` with UUID primary keys.
3. **Audit Fields:** Every entity table MUST include `is_deleted` (boolean), `deleted_at`, `created_at`, and `updated_at`.
4. **Triggers:** `updated_at` must be auto-updated via PostgreSQL triggers (defined in migrations).
5. **Soft Deletes:** NEVER hard delete data. API `DELETE` routes MUST set `is_deleted = true`.
6. **RLS Policies:** Every table MUST have Row Level Security enabled. Policies should be restrictive by default and defined in Drizzle migrations.

## 4. Authentication & RBAC Rules

1. **Supabase Auth:** DO NOT write custom JWT or bcrypt logic. Use `@supabase/ssr` exclusively.
2. **DB-driven RBAC:** The `users`, `roles`, and `permissions` tables dictate access.
3. **Permission Types:** Permissions MUST use the `resource:action` format (e.g., `account:create`).
4. **Gatekeeping:** 
   - Backend: Use `await requirePermission('resource:action')` in API routes.
   - Frontend: Use `<PermissionGate permission="resource:action">` to hide UI elements.

## 5. Security & Observability

1. **No Secrets in Client:** Variables without `NEXT_PUBLIC_` MUST NEVER be used in `"use client"` files.
2. **Validation:** All API request bodies and frontend forms MUST use Zod schemas defined in `src/lib/validators/`.
3. **Logging:** Use `src/lib/observability/logger.ts`. Do not use `console.log` directly in production code.
4. **Error Boundaries:** Every layout should have a corresponding `error.tsx` to catch exceptions gracefully using Sentry.

## 6. Deployment Rules

1. **Vercel Native:** The app is designed for Vercel. Do not introduce Docker, Nginx, or separate backend servers.
2. **Environment Variables:** `DATABASE_URL` must point to Supabase's transaction pooler (port 6543) in production.
3. **CI/CD:** GitHub actions handle linting and testing. Vercel handles the build and deployment.

## 7. Error Handling Rules
1. `catch (error: any)` is FORBIDDEN. Use `catch (error: unknown)` and narrow with `instanceof Error`.
2. Every `app/[locale]/` layout segment MUST have a co-located `error.tsx`.
3. All Zod schemas MUST be defined in `src/lib/validators/`. Inline schemas in route files are forbidden.

## 8. Testing Rules
1. Every new API route MUST have a corresponding test in `tests/api/`.
2. Every new Drizzle schema table MUST have a schema-shape test in `tests/db/`.
3. Minimum coverage threshold: 70% lines.

## 9. TypeScript Rules
1. `error: any` is FORBIDDEN in catch blocks.
2. Dynamic route params MUST be typed as `Promise<{id: string}>` and awaited.
3. The `cn()` utility lives exclusively in `src/components/ui/Button.tsx` (or a dedicated `src/lib/utils.ts`). Do not re-export incorrectly.

## 10. Entity Standards
1. Every business entity table MUST include: `id`, `owner_id`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`, `is_active`.
2. The `cn()` merge utility must never be duplicated.
