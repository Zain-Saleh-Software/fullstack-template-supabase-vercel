# AI Initialization Skill (Vercel + Supabase Stack)

**Description:** Step-by-step instructions for bootstrapping a new project from this template.
**Role:** The Architect

## CRITICAL: POC CLEANUP Mandate (DO NOT SKIP)

This template ships with **POC (Proof of Concept) code** — demo pages, sample API routes, placeholder entities (`accounts`, `contacts`), SVGs, tables, and POC logic. These exist ONLY to guide the AI on where to add your new project's code. They are scaffolding, nothing more.

**THE RULE:** After ALL your new project code is in place (entities, pages, APIs, tests), you MUST:
- ✅ **REMOVE** all POC code: demo pages, sample entities, template API routes, POC SVGs, POC tables, POC logic — everything that was only there to demonstrate the template.
- 🚫 **NEVER TOUCH** `.agents/`, `.claude/`, `CLAUDE.md`, `RULES.md`, or any agent configuration in `.agents/` or `.claude/`. These are **permanent infrastructure** — they stay intact forever.
- ℹ️ **EVOLVE** `skills/` and `councils/` as the project grows — these are project infrastructure that evolves with your needs, but changes should be deliberate and documented.

The POC code serves its purpose the moment the new project has working code. After that, it becomes noise and must be eliminated. See **PHASE 7** for the full cleanup checklist.

---

## PRE-REQUISITES: UNDERSTAND THE ARCHITECTURE
Before starting, read `RULES.md` and `CLAUDE.md`. You must understand that this template uses **Next.js 15 App Router, Supabase (Database/Auth), Drizzle ORM, and Tailwind v4**. 
**DO NOT use Docker, FastAPI, Python, Redis, or Nginx.**

---

## PHASE 1: PROJECT CONFIGURATION & RENAMING (The "Search and Replace")

1. The project relies on standard `package.json` for all dependencies. 
2. Ask the user for the `PROJECT_NAME`.
3. Use your tools to perform a global find-and-replace to change `fullstack-template` to the `[PROJECT_NAME]`.
   - Update `package.json`
   - Update `README.md`
   - Update `src/app/[locale]/layout.tsx` metadata.

### ✅ Phase 1 Validation
- [ ] Project name updated in all locations
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] No references to "fullstack-template" remain (except in git history)

---

## PHASE 2: DATABASE & SUPABASE SETUP

1. Ask the user to create a new Supabase project on `https://supabase.com` or run `npx supabase start` locally.
2. Ask the user to provide the following keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL` (Connection pooler URL for Drizzle)
3. Populate `.env.local` with these values.
4. Run `npm run db:generate` to generate the Drizzle migrations.
5. Apply migrations using `npm run db:push`. This establishes the core tables (`users`, `roles`, `permissions`).
6. Remind the user to run the custom SQL `drizzle/0001_custom_rls_and_triggers.sql` directly in their Supabase SQL editor to enable RLS and triggers.

### ✅ Phase 2 Validation
- [ ] Environment variables configured correctly
- [ ] Database connection successful
- [ ] Migrations applied without errors
- [ ] RLS policies enabled
- [ ] `npm run db:studio` opens successfully
- [ ] Core tables exist with proper structure

---

## PHASE 3: THE GOLDEN QUESTION (Business Entities)

The template comes with POC entities (`accounts`, `contacts`). You must replace them with the user's actual business domain.

1. **Ask the User:** *"What are the core business entities for your CRM/HR application? (e.g., Candidates, Invoices, Properties, Patients)"*
2. **Delete POC Entities (aggressively):** 
   - Remove `accounts` and `contacts` from `src/lib/db/schema/index.ts`.
   - Remove `src/app/api/v1/accounts/` entirely (all route files).
   - Remove `src/lib/validators/account.ts` and `src/lib/validators/contact.ts` if they exist.
   - Remove all test files referencing accounts/contacts.
   - Remove any POC frontend pages for accounts/contacts under `src/app/[locale]/dashboard/`.
   - Remove any POC React Query hooks tied to accounts/contacts.
   - Remove any POC seed data for accounts/contacts from `src/lib/db/seed.ts`.
3. **Create New Entities:**
   - Define new Drizzle `pgTable` definitions in `src/lib/db/schema/index.ts`.
   - **CRITICAL:** Ensure every new table includes: `id` (uuid), `owner_id` (uuid), `is_deleted` (boolean), `deleted_at` (timestamp), `created_at` (timestamp), `updated_at` (timestamp), `is_active` (boolean).
   - Generate a new migration (`npm run db:generate`).
   - Apply the migration (`npm run db:push`).
   - Create Zod validation schemas in `src/lib/validators/[entity].ts`.
   - Create API Route handlers in `src/app/api/v1/[entity]/route.ts`.
   - Implement standard `paginatedResponse` for GET lists and standard Zod validation for POST/PATCH.
   - Add proper RBAC checks using `requirePermission`.
4. **Create Tests:**
   - Create API tests in `tests/api/[entity].test.ts`.
   - Create schema tests in `tests/db/[entity].test.ts`.
   - Ensure tests cover CRUD operations, permissions, and validation.

### ✅ Phase 3 Validation
- [ ] All POC entities removed
- [ ] New entities defined with all required audit fields
- [ ] Migrations generated and applied
- [ ] Zod validation schemas created
- [ ] API routes created with proper RBAC
- [ ] Tests created and passing
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds

---

## PHASE 4: ROLE BASED ACCESS CONTROL (RBAC) SEEDING

1. The template uses a strict DB-driven RBAC engine (`src/lib/auth/rbac.ts`).
2. Ask the user for the default Roles they need (e.g., `Admin`, `Manager`, `Employee`).
3. Define the Permissions for those roles based on the entities created in Phase 3 (e.g., `invoice:read`, `invoice:create`).
4. Update `src/lib/db/seed.ts` to automatically populate these `roles` and `permissions` in the database.
5. Update `src/lib/auth/rbac.ts` to include the new permission types in the `PermissionType` union.

### ✅ Phase 4 Validation
- [ ] Roles defined based on user requirements
- [ ] Permissions defined for each role and entity
- [ ] Seed script updated with roles and permissions
- [ ] RBAC types updated with new permissions
- [ ] `npm run db:seed` runs successfully
- [ ] Database contains correct roles and permissions
- [ ] Permission checks work correctly in API routes

---

## PHASE 5: FRONTEND SCAFFOLDING

1. Using Next.js App Router, generate the CRUD pages for the new entities under `src/app/[locale]/dashboard/[entity]/page.tsx`.
2. Use Tailwind CSS v4 for styling. Ensure all components support dark mode using the `.dark` class patterns.
3. Wrap actions in the `<PermissionGate permission="[resource]:[action]"/>` component so unauthorized users do not see buttons they cannot click.
4. Implement standard React Query hooks (`useQuery`, `useMutation`) in Client Components to interact with the API Routes.
5. Create reusable components for common UI patterns (tables, forms, modals).
6. Ensure proper error boundaries and loading states.
7. Implement proper i18n support using `next-intl`.

### ✅ Phase 5 Validation
- [ ] CRUD pages created for all entities
- [ ] Dark mode support implemented
- [ ] Permission gates on all protected actions
- [ ] React Query hooks implemented
- [ ] Components are reusable and well-structured
- [ ] Error boundaries in place
- [ ] Loading states implemented
- [ ] i18n support working
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Frontend tests pass (if applicable)

---

## PHASE 6: DEPLOYMENT

1. Instruct the user to push their code to a GitHub repository.
2. Instruct the user to connect the repository to Vercel.
3. Ensure they add all environment variables to the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
   - Any other required environment variables
4. The deployment will automatically work without Docker or complex CI/CD due to the native Next.js + Vercel synergy.
5. Verify the deployment by checking the Vercel dashboard and testing the live application.

### ✅ Phase 6 Validation
- [ ] Code pushed to GitHub
- [ ] Vercel project connected
- [ ] Environment variables configured in Vercel
- [ ] Deployment successful
- [ ] Live application accessible
- [ ] Database connection working in production
- [ ] Authentication working in production
- [ ] API routes responding correctly
- [ ] No errors in Vercel function logs
- [ ] Sentry integration working (if configured)

---

## PHASE 7: POC CODE CLEANUP (FINAL PURGE)

**This is mandatory.** The template's POC code must be completely removed once new project code is in place.

> **Full cleanup instructions:** See `skills/poc-cleanup.md` for the exhaustive cleanup checklist, what to remove, what never to touch, and post-cleanup validation steps.

### Quick Summary

The POC entities (`accounts`, `contacts`) and all related code (pages, API routes, validators, components, tests, migrations, SVGs) must be completely removed. The `.agents/`, `.claude/`, `CLAUDE.md`, and `RULES.md` files are immutable and must never be touched.

### ✅ Phase 7 Validation
- [ ] All POC code removed per `skills/poc-cleanup.md` checklist
- [ ] All immutable files untouched (`.agents/`, `.claude/`, `CLAUDE.md`, `RULES.md`)
- [ ] `npm run lint` passes after cleanup
- [ ] `npm run build` succeeds after cleanup
- [ ] `npm run test` passes after cleanup

---

## POST-BOOTSTRAP VALIDATION

After completing all phases, run this comprehensive validation:

### Security Audit
- [ ] All API routes have proper RBAC checks
- [ ] All user input is validated with Zod schemas
- [ ] No secrets exposed to client-side code
- [ ] RLS policies properly configured
- [ ] SQL injection prevention (using Drizzle ORM)
- [ ] Authentication working correctly

### Code Quality Audit
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code follows naming conventions
- [ ] Proper error handling throughout
- [ ] Structured logging implemented
- [ ] No `console.log()` in production code

### Testing Audit
- [ ] All tests passing
- [ ] Test coverage meets minimum thresholds (70% overall, 90% for API routes)
- [ ] Tests cover edge cases and error scenarios
- [ ] Integration tests for critical paths

### Architecture Audit
- [ ] No forbidden technologies introduced
- [ ] Proper Server/Client component separation
- [ ] API routes follow established patterns
- [ ] Database schemas include all required fields
- [ ] Proper file organization maintained

### Documentation Audit
- [ ] README updated with project-specific information
- [ ] API documentation complete
- [ ] Database schema documented
- [ ] Environment variables documented
- [ ] Deployment instructions clear

---

## FINAL CHECKLIST

Before declaring the bootstrap complete, verify:

- [ ] All 7 phases completed successfully
- [ ] All validation checklists passed
- [ ] Application builds without errors
- [ ] All tests pass
- [ ] Security audit passed
- [ ] Deployment successful
- [ ] User understands the architecture
- [ ] User can continue development independently

---

## TROUBLESHOOTING

If issues arise during bootstrap:

1. **Database Connection Issues:**
   - Verify environment variables are correct
   - Check Supabase project is active
   - Ensure DATABASE_URL points to connection pooler (port 6543)

2. **Migration Errors:**
   - Check for syntax errors in schema definitions
   - Ensure all required fields are present
   - Verify foreign key relationships are correct

3. **Build Failures:**
   - Run `npm run lint` to identify TypeScript/ESLint issues
   - Check for missing dependencies
   - Verify all imports are correct

4. **Test Failures:**
   - Check mock implementations are correct
   - Verify test setup is complete
   - Ensure async operations are properly awaited

5. **Deployment Issues:**
   - Verify all environment variables are set in Vercel
   - Check Vercel build logs for errors
   - Ensure database migrations are applied

---

**CONCLUSION:** Once all 7 phases are complete (including the POC code purge) and all validations pass, inform the user the bootstrap process is successful and the project is ready for feature development. Provide them with:
- A summary of what was created
- Key files and directories to understand
- Next steps for continued development
- Important commands they'll need to know
- Support resources and documentation