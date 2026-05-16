# AI Initialization Skill (Vercel + Supabase Stack)

**Description:** Step-by-step instructions for bootstrapping a new project from this template.
**Role:** The Architect

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

---

## PHASE 3: THE GOLDEN QUESTION (Business Entities)

The template comes with POC entities (`accounts`, `contacts`). You must replace them with the user's actual business domain.

1. **Ask the User:** *"What are the core business entities for your CRM/HR application? (e.g., Candidates, Invoices, Properties, Patients)"*
2. **Delete the POCs:** 
   - Remove `accounts` and `contacts` from `src/lib/db/schema/index.ts`.
   - Remove the `src/app/api/v1/accounts` API routes.
3. **Create New Entities:**
   - Define new Drizzle `pgTable` definitions in `src/lib/db/schema/index.ts`.
   - Ensure every new table includes: `id` (uuid), `owner_id` (uuid), `is_deleted` (boolean), `deleted_at` (timestamp), `created_at` (timestamp), `updated_at` (timestamp).
   - Generate a new migration (`npm run db:generate`).
   - Create the corresponding API Route handlers in `src/app/api/v1/[entity]/route.ts`.
   - Implement standard `paginatedResponse` for GET lists and standard Zod validation for POST/PATCH.

---

## PHASE 4: ROLE BASED ACCESS CONTROL (RBAC) SEEDING

1. The template uses a strict DB-driven RBAC engine (`src/lib/auth/rbac.ts`).
2. Ask the user for the default Roles they need (e.g., `Admin`, `Manager`, `Employee`).
3. Define the Permissions for those roles based on the entities created in Phase 3 (e.g., `invoice:read`, `invoice:create`).
4. Update `src/lib/db/seed.ts` to automatically populate these `roles` and `permissions` in the database.

---

## PHASE 5: FRONTEND SCAFFOLDING

1. Using Next.js App Router, generate the CRUD pages for the new entities under `src/app/[locale]/dashboard/[entity]/page.tsx`.
2. Use Tailwind CSS v4 for styling. Ensure all components support dark mode using the `.dark` class patterns.
3. Wrap actions in the `<PermissionGate permission="[resource]:[action]"/>` component so unauthorized users do not see buttons they cannot click.
4. Implement standard React Query hooks (`useQuery`, `useMutation`) in Client Components to interact with the API Routes.

---

## PHASE 6: DEPLOYMENT

1. Instruct the user to push their code to a GitHub repository.
2. Instruct the user to connect the repository to Vercel.
3. Ensure they add all environment variables to the Vercel project settings.
4. The deployment will automatically work without Docker or complex CI/CD due to the native Next.js + Vercel synergy.

**CONCLUSION:** Once Phase 6 is complete, inform the user the bootstrap process is successful and the project is ready for feature development.
