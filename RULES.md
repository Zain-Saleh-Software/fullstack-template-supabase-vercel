# Template Rules

> **Source of Truth:** This file defines the EXACT architectural, structural, and operational rules for this Next.js + Supabase template.
> **Compliance:** Mandatory for every project bootstrapped from this template.
> **Deviation:** Forbidden unless the user explicitly overrides a rule.

## 1. Technology Stack (Immutable)

The stack is frozen and strictly non-negotiable to maintain consistency across all CRM/HR projects.

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15+ (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, `clsx` + `tailwind-merge` |
| **Backend** | Next.js API Routes (Route Handlers) |
| **Database** | Supabase PostgreSQL, Drizzle ORM |
| **Authentication**| Supabase Auth (Server & Client SDKs) |
| **State** | TanStack Query (Server state), Context API (Local) |
| **Forms** | `react-hook-form` + `zod` |
| **i18n** | `next-intl` (Middleware + SSR) |
| **Observability** | Vercel Analytics + Sentry + custom structured logger |
| **Deployment** | Vercel (Frontend/API) + Supabase (DB/Auth) |

### ❌ FORBIDDEN Technologies
- **NO Docker** - Vercel handles deployment natively
- **NO Python/FastAPI** - Use Next.js API Routes
- **NO Redis** - Use Supabase caching or Vercel KV if needed
- **NO separate backend servers** - Everything runs on Vercel
- **NO custom JWT/bcrypt** - Use Supabase Auth exclusively
- **NO raw SQL** - Use Drizzle ORM (except via `drizzle.execute(sql`)`)
- **NO MongoDB/MySQL** - Supabase PostgreSQL only
- **NO Redux/MobX** - Use TanStack Query + Context API

## 2. Next.js App Router Rules

1. **Server vs Client Components:** Default to Server Components (`export default async function`). Use `"use client"` only when necessary (hooks, interactivity, React Query providers).
2. **Data Fetching:** Prefer Server Components fetching directly from Drizzle ORM. Use React Query in Client Components only for mutations or highly dynamic polling.
3. **API Routes:** All REST endpoints must reside in `src/app/api/v1/`. They must use the `requirePermission` helper and return standardized responses via `paginatedResponse` or `apiError`.
4. **Middleware:** `src/middleware.ts` MUST handle both `next-intl` locale routing and Supabase session refreshing.
5. **File Naming:** Use kebab-case for all file names (e.g., `user-profile.tsx`, not `UserProfile.tsx`).
6. **Directory Structure:** Follow the established pattern: `src/app/[locale]/`, `src/components/`, `src/lib/`, `src/app/api/v1/`.

### ❌ FORBIDDEN Patterns
- `console.log()` in production code - use `logger` from `src/lib/observability/logger.ts`
- `error: any` in catch blocks - use `catch (error: unknown)` and narrow with `instanceof Error`
- Inline Zod schemas in route files - all schemas must be in `src/lib/validators/`
- Direct `fetch()` calls in Client Components - use React Query
- Mixing Server and Client logic in the same file without clear separation

## 3. Database & ORM Rules

1. **Drizzle Only:** All database interactions MUST use Drizzle ORM (`src/lib/db/`). No raw SQL unless using `drizzle.execute(sql\``...`\`)`.
2. **Schema:** All schemas live in `src/lib/db/schema/index.ts`. All tables MUST be `pgTable` with UUID primary keys.
3. **Audit Fields:** Every entity table MUST include:
   - `id` (uuid, primary key)
   - `owner_id` (uuid, foreign key to users)
   - `is_deleted` (boolean, default false)
   - `deleted_at` (timestamp, nullable)
   - `created_at` (timestamp, default now)
   - `updated_at` (timestamp, default now)
   - `is_active` (boolean, default true) - for soft activation/deactivation
4. **Triggers:** `updated_at` must be auto-updated via PostgreSQL triggers (defined in migrations).
5. **Soft Deletes:** NEVER hard delete data. API `DELETE` routes MUST set `is_deleted = true`.
6. **RLS Policies:** Every table MUST have Row Level Security enabled. Policies should be restrictive by default and defined in Drizzle migrations.
7. **Indexes:** Add indexes on frequently queried fields (owner_id, created_at, status, etc.).

### ❌ FORBIDDEN Database Patterns
- Hard deletes (use soft deletes)
- Tables without audit fields
- Missing RLS policies
- Raw SQL queries (use Drizzle)
- Missing foreign key constraints
- Tables without `owner_id` for multi-tenancy

## 4. Authentication & RBAC Rules

1. **Supabase Auth:** DO NOT write custom JWT or bcrypt logic. Use `@supabase/ssr` exclusively.
2. **DB-driven RBAC:** The `users`, `roles`, and `permissions` tables dictate access.
3. **Permission Types:** Permissions MUST use the `resource:action` format (e.g., `account:create`).
4. **Gatekeeping:** 
   - Backend: Use `await requirePermission('resource:action')` in API routes.
   - Frontend: Use `<PermissionGate permission="resource:action">` to hide UI elements.
5. **Superuser Bypass:** Superusers (`is_superuser = true`) bypass all permission checks.
6. **Row-Level Security:** RLS policies must complement RBAC, not replace it.

### ❌ FORBIDDEN Auth Patterns
- Custom authentication logic
- Hardcoded permissions in code
- Missing permission checks on API routes
- Exposing sensitive data in client-side code
- Using server-only environment variables (without `NEXT_PUBLIC_` prefix) in client components — these will be `undefined` at runtime and may expose the missing variable name

## 5. Security & Observability

1. **No Secrets in Client:** Variables without `NEXT_PUBLIC_` MUST NEVER be used in `"use client"` files.
2. **Validation:** All API request bodies and frontend forms MUST use Zod schemas defined in `src/lib/validators/`.
3. **Logging:** Use `src/lib/observability/logger.ts`. Do not use `console.log` directly in production code.
4. **Error Boundaries:** Every layout should have a corresponding `error.tsx` to catch exceptions gracefully using Sentry.
5. **Input Sanitization:** All user input must be validated and sanitized before database operations.
6. **SQL Injection Prevention:** Always use parameterized queries (Drizzle handles this automatically).
7. **CORS:** Configure CORS properly in API routes if needed for cross-origin requests.

### ❌ FORBIDDEN Security Patterns
- Exposing `DATABASE_URL` or Supabase service role keys to client
- Returning raw database errors to clients
- Missing input validation
- SQL injection vulnerabilities
- Insecure direct object references (IDOR)
- Missing rate limiting on sensitive endpoints

## 6. Deployment Rules

1. **Vercel Native:** The app is designed for Vercel. Do not introduce Docker, Nginx, or separate backend servers.
2. **Environment Variables:** `DATABASE_URL` must point to Supabase's transaction pooler (port 6543) in production.
3. **CI/CD:** GitHub actions handle linting and testing. Vercel handles the build and deployment.
4. **Build Verification:** All builds must pass linting, type checking, and testing before deployment.
5. **Environment Parity:** Local development should mirror production as closely as possible.

### ❌ FORBIDDEN Deployment Patterns
- Docker containers
- Custom servers or VPS
- Manual deployment processes
- Skipping CI/CD checks
- Deploying without passing tests

## 7. Error Handling Rules

1. `catch (error: any)` is FORBIDDEN. Use `catch (error: unknown)` and narrow with `instanceof Error`.
2. Every `app/[locale]/` layout segment MUST have a co-located `error.tsx`.
3. All Zod schemas MUST be defined in `src/lib/validators/`. Inline schemas in route files are forbidden.
4. API errors must return standardized error responses using `apiError()` helper.
5. Error messages must be user-friendly and never expose internal implementation details.
6. All errors must be logged using the structured logger for observability.

### ❌ FORBIDDEN Error Patterns
- `error: any` type annotations
- Missing error boundaries
- Exposing stack traces to users
- Silent failures (errors without logging)
- Generic error messages without context

## 8. Testing Rules

1. **Test Coverage Requirements:**
   - API routes: 90% minimum coverage
   - Database schemas: 100% coverage (structure validation)
   - Authentication/RBAC: 100% coverage
   - Overall project: 70% minimum coverage
2. **Test Structure:** Every new API route MUST have a corresponding test in `tests/api/`.
3. **Schema Tests:** Every new Drizzle schema table MUST have a schema-shape test in `tests/db/`.
4. **Test-First Pattern:** Write tests before implementing features whenever possible.
5. **Test Categories:**
   - **Unit Tests:** Individual functions and utilities
   - **Integration Tests:** API routes with mocked database
   - **E2E Tests:** Critical user workflows (optional but encouraged)
6. **Test Naming:** Use descriptive names: `describe('POST /api/v1/accounts', () => { ... })`

### ❌ FORBIDDEN Testing Patterns
- Tests without assertions
- Mocking everything (test real behavior)
- Flaky tests (use proper async handling)
- Tests that depend on execution order
- Skipping tests without justification

## 9. TypeScript Rules

1. `error: any` is FORBIDDEN in catch blocks.
2. Dynamic route params MUST be typed as `Promise<{id: string}>` and awaited.
3. The `cn()` utility lives exclusively in `src/lib/utils.ts`. Do not re-export incorrectly.
4. All function parameters and return types must be explicitly typed.
5. Avoid `as any` type assertions - use proper type guards.
6. Use `unknown` instead of `any` for uncertain types.

### ❌ FORBIDDEN TypeScript Patterns
- `any` type (use `unknown` with type guards)
- Missing type definitions
- Improper type assertions
- Union types without proper narrowing
- Implicit any types

## 10. Entity Standards

1. Every business entity table MUST include: `id`, `owner_id`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`, `is_active`.
2. The `cn()` merge utility must never be duplicated.
3. All entities must have corresponding:
   - Zod validation schemas in `src/lib/validators/`
   - API routes in `src/app/api/v1/[entity]/`
   - Tests in `tests/api/[entity].test.ts`
   - Database tests in `tests/db/[entity].test.ts`

### ❌ FORBIDDEN Entity Patterns
- Entities without audit fields
- Missing validation schemas
- API routes without permission checks
- Entities without corresponding tests
- Business logic in API routes (should be in `src/lib/`)

## 11. Code Quality Standards

1. **Naming Conventions:**
   - Files: kebab-case (`user-profile.tsx`)
   - Components: PascalCase (`UserProfile`)
   - Functions/Variables: camelCase (`getUserData`)
   - Constants: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
   - Database: snake_case (`created_at`)

2. **File Organization:**
   - Maximum file length: 300 lines (split if longer)
   - Maximum function length: 50 lines (extract if longer)
   - One component per file (except small utilities)
   - Group related files in directories

3. **Comments & Documentation:**
   - Complex logic must have explanatory comments
   - All public functions must have JSDoc comments
   - API routes must document request/response formats
   - Database schemas must document field purposes

4. **Import Organization:**
   - Next.js imports first
   - React imports second
   - Third-party libraries third
   - Internal imports last
   - Use absolute imports with `@/` alias

### ❌ FORBIDDEN Code Quality Patterns
- Long functions (>50 lines)
- Deep nesting (>3 levels)
- Magic numbers (use constants)
- Duplicate code (DRY principle)
- Missing documentation
- Inconsistent naming

## 12. i18n (Internationalization) Rules

1. **Framework:** Use `next-intl` exclusively for all translations and locale routing.
2. **Message Files:** Translations live in `messages/{locale}.json`. Every user-facing string must use translation keys.
3. **Locale Routing:** URLs follow `/{locale}/path` pattern. Middleware handles locale detection and redirect.
4. **Server Components:** Use `getTranslations` from `next-intl/server`.
5. **Client Components:** Use `useTranslations` from `next-intl`.
6. **RTL Support:** Arabic (`ar`) and other RTL locales must set `dir="rtl"` on the HTML element.
7. **Default Locale:** English (`en`) is the default. All translation files must be kept in sync.

### ❌ FORBIDDEN i18n Patterns
- Hardcoded user-facing strings (must use translation keys)
- Missing translations for any supported locale
- Inconsistent key structures across locale files

## 13. Accessibility (a11y) Rules

1. **Semantic HTML:** Use proper semantic elements (`<nav>`, `<main>`, `<section>`, `<button>`, `<a>`).
2. **ARIA Labels:** All interactive elements must have accessible names (aria-label, aria-labelledby).
3. **Keyboard Navigation:** All interactive elements must be keyboard accessible (focusable, activatable).
4. **Focus Management:** Manage focus for modals, dialogs, and route changes.
5. **Color Contrast:** Text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text).
6. **Form Labels:** Every form input must have an associated `<label>` element.
7. **Images:** All images must have descriptive `alt` text.
8. **Screen Reader Support:** Use `sr-only` utility for visually hidden but accessible content.

### ❌ FORBIDDEN a11y Patterns
- Non-semantic `<div>` as buttons without proper ARIA roles
- Missing form labels
- Empty or missing `alt` attributes on images
- Focus traps without escape mechanisms

## 14. Performance Rules

1. **Server Components:** Fetch data in Server Components to avoid client-side waterfalls.
2. **Bundle Size:** Minimize client bundle — only import what's needed in `"use client"` components.
3. **Image Optimization:** Use `next/image` for all images with proper `width`, `height`, and `priority` attributes.
4. **Code Splitting:** Use dynamic imports (`next/dynamic`) for heavy client components not needed immediately.
5. **Caching:** Leverage Next.js data cache (`unstable_cache` or `fetch` options) for expensive queries.
6. **Database:** Ensure proper indexes on frequently queried columns; avoid N+1 queries.
7. **Font Loading:** Use `next/font` or `@fontsource` with proper `display: swap` for font loading.

### ❌ FORBIDDEN Performance Patterns
- Large client bundles due to unnecessary `"use client"` directives
- Missing image optimization (width, height, lazy loading)
- Blocking render with synchronous data fetching in Client Components
- Missing database indexes on queried columns

## 15. Component Architecture Rules

1. **Atomic Structure:** Organize components by complexity:
   - `src/components/ui/` — Primitives (Button, Input, Card, Modal, Badge)
   - `src/components/forms/` — Form components (FormField, FormSelect, FormInput)
   - `src/components/layout/` — Layout components (Sidebar, Header, MainContent)
   - `src/components/[feature]/` — Feature-specific components (AccountTable, UserProfile)
2. **Composition over Configuration:** Favor component composition (children, slots) over config objects.
3. **Single Responsibility:** Each component does one thing. Extract sub-components when logic grows.
4. **Server/Client Separation:** Keep data-fetching Server Components separate from interactive Client Components. Pass data down as props.
5. **Reusability:** Extract shared patterns into `src/components/ui/` primitives.
6. **Error Boundaries:** Wrap interactive sections in individual error boundaries (not just layout-level).

### ❌ FORBIDDEN Component Patterns
- God components (>300 lines) that render entire pages
- Mixing data fetching and interactivity in the same component without clear separation
- Duplicating UI primitives across feature components
- Business logic inside presentational components

## 16. AI Agent Enforcement Rules

When an AI agent (Claude, etc.) works on this template, it MUST:

1. **Simulate Three Perspectives:**
   - **Architect:** Ensures architectural compliance
   - **Reviewer:** Checks for security and quality issues
   - **Executor:** Writes clean, type-safe code

2. **Follow Pre-Commit Checklist:**
   - [ ] Code follows all RULES.md guidelines
   - [ ] All tests pass
   - [ ] Linting passes with no errors
   - [ ] TypeScript compilation succeeds
   - [ ] No forbidden patterns detected
   - [ ] Security checks pass
   - [ ] Documentation updated if needed

3. **Perform Self-Review:**
   - Review own code for rule violations
   - Check for edge cases and error handling
   - Verify security implications
   - Ensure test coverage is adequate

4. **Document Decisions:**
   - Explain architectural choices in commits
   - Document any rule exceptions with justification
   - Note any technical debt created

5. **Validate Before Committing:**
   - Run `npm run validate-rules`
   - Run `npm run lint`
   - Run `npm run test`
   - Run `npm run build`

### ❌ FORBIDDEN AI Behaviors
- Ignoring rules for "quick fixes"
- Committing without running validation
- Making architectural changes without consultation
- Skipping tests to meet deadlines
- Introducing forbidden technologies
- Bypassing security checks