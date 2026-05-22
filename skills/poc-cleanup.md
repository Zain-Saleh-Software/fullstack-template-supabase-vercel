# POC Cleanup Skill (Vercel + Supabase Stack)

**Description:** Comprehensive instructions for removing all Proof of Concept (POC) code, demo entities, template pages, and scaffolding artifacts after the real project code is in place.
**Role:** The Executor / The Reviewer
**Trigger:** Invoked explicitly by the user ("clean up POC code", "remove demo code"), or automatically after Phase 7 of `ai-init-project.md` bootstrap.

---

## WHY THIS EXISTS

This template ships with POC entities (`accounts`, `contacts`), demo pages, sample API routes, placeholder components, and test files. These exist ONLY to demonstrate the correct patterns and guide AI agents toward the proper architecture.

Once the real project's entities, pages, APIs, and tests are built, the POC code becomes noise, bloat, and a source of confusion. It MUST be completely removed.

---

## PRE-CLEANUP VALIDATION (MANDATORY)

Before removing ANY POC code, verify the new project code is in place:

- [ ] All real business entities defined in `src/lib/db/schema/index.ts`
- [ ] All real Zod validators in `src/lib/validators/`
- [ ] All real API routes in `src/app/api/v1/`
- [ ] All real frontend pages under `src/app/[locale]/`
- [ ] All real components in `src/components/`
- [ ] All real tests in `tests/api/` and `tests/db/`
- [ ] RBAC permissions updated for real entities in `src/lib/auth/rbac.ts`
- [ ] Seed data updated in `src/lib/db/seed.ts`
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds

**If any of the above fails, DO NOT proceed with cleanup. Fix the new code first.**

---

## WHAT TO REMOVE (Exhaustive List)

### 1. Database Layer

#### Schema (`src/lib/db/schema/index.ts`)
Remove the ENTIRE POC table definitions:

```typescript
// REMOVE THESE BLOCKS ENTIRELY:
export const accounts = pgTable("accounts", { ... });
export const contacts = pgTable("contacts", { ... });
```

#### Seed Data (`src/lib/db/seed.ts`)
Remove all POC seed data:
- Any `INSERT INTO accounts` statements
- Any `INSERT INTO contacts` statements
- Any seed functions that populate accounts/contacts tables
- Any seed functions that insert account:*/contact:* permissions

#### Migration Files (`drizzle/`)
Remove POC-specific migration files:
- `drizzle/0000_amusing_scrambler.sql` — Initial schema with POC tables (can remove after generating new migration)
- `drizzle/meta/0000_snapshot.json` — POC schema snapshot (remove after new migration)
- Keep `drizzle/0001_custom_rls_and_triggers.sql` — Infrastructure (needed for all projects)
- Keep `drizzle/0002_add_is_active_to_entities.sql` — Infrastructure (needed for all projects)
- After removing old migrations, run `npm run db:generate` to create fresh migrations for your real entities

### 2. API Layer

Remove ENTIRE directories:

```
src/app/api/v1/accounts/          ← DELETE ENTIRE DIRECTORY
  ├── route.ts
  └── [id]/route.ts
src/app/api/v1/contacts/          ← DELETE ENTIRE DIRECTORY
  ├── route.ts
  └── [id]/route.ts
```

### 3. Validator Layer

Remove ENTIRE files:

```
src/lib/validators/account.ts     ← DELETE FILE
src/lib/validators/contact.ts     ← DELETE FILE
```

### 4. Frontend Pages

Remove ENTIRE directories:

```
src/app/[locale]/(authenticated)/accounts/        ← DELETE ENTIRE DIRECTORY
  ├── page.tsx
  ├── new/page.tsx
  └── [id]/edit/page.tsx
src/app/[locale]/(authenticated)/contacts/        ← DELETE ENTIRE DIRECTORY
  ├── page.tsx
  ├── new/page.tsx
  └── [id]/edit/page.tsx
```

### 5. Components

Remove POC-specific component files:

```
src/components/forms/account-form.tsx     ← DELETE FILE (POC)
src/components/forms/contact-form.tsx     ← DELETE FILE (POC)
```

### 6. Tests

Remove all POC test files:

```
tests/api/accounts.test.ts        ← DELETE FILE
tests/api/contacts.test.ts        ← DELETE FILE
tests/api/contacts-id.test.ts     ← DELETE FILE
```

Keep non-POC tests:
```
tests/api/auth.test.ts            ← KEEP (infrastructure tests)
tests/db/schema.test.ts           ← KEEP (infrastructure tests — but update to check your real entities)
tests/setup.ts                    ← KEEP (test infrastructure)
```

### 7. RBAC Types

In `src/lib/auth/rbac.ts`, remove POC permission types from the `PermissionType` union:

```typescript
// REMOVE these lines:
| "account:read"
| "account:create"
| "account:update"
| "account:delete"
| "contact:read"
| "contact:create"
| "contact:update"
| "contact:delete"
```

Add your real project's permissions instead.

### 8. POC Assets

Remove POC SVGs from `public/`:

```
public/window.svg      ← DELETE (POC demo asset)
public/vercel.svg      ← DELETE (POC demo asset)
public/next.svg        ← DELETE (POC demo asset)
public/globe.svg       ← DELETE (POC demo asset)
public/file.svg        ← DELETE (POC demo asset)
```

Remove `public/README.md` if it was the POC asset identification file.

### 9. Translation Files

In `messages/en.json` and `messages/ar.json`, remove POC translation keys:
- `accounts.*` — all keys under the accounts namespace
- `contacts.*` — all keys under the contacts namespace

### 10. Smoketest Scripts — DO NOT DELETE, BUT UPDATE

The smoke test scripts reference POC entities. They need to be UPDATED, not deleted:

- `scripts/smoke-test.js` — Update `requiredPaths` to reference your real entities instead of accounts/contacts
- `scripts/runtime-smoke-test.js` — Update test cases to use your real entities' API routes instead of accounts/contacts

The validation script handles this gracefully:
- `scripts/validate-rules.js` — Already skips business table audit checks when no business tables exist

---

## WHAT TO NEVER TOUCH (IMMUTABLE)

These files are the project's constitution. NEVER modify or delete them:

```
.agents/                    ← ALL CONTENTS — Permanent AI agent infrastructure
.claude/                    ← ALL CONTENTS — Permanent AI agent infrastructure
CLAUDE.md                   ← NEVER MODIFY — AI agent constitution
RULES.md                    ← NEVER MODIFY — Immutable technical law
.githooks/                  ← Git hooks — Infrastructure
.github/workflows/          ← CI/CD pipeline — Infrastructure
```

Any `.md` or `.toml` file inside `.agents/` or `.claude/` is immutable.

---

## WHAT EVOLVES WITH THE PROJECT

These project-level infrastructure files can be refined as the project matures:

```
skills/                     ← Skill files grow and improve with the project
councils/                   ← Council checklists adapt to project needs
```

Changes to `skills/` or `councils/` must be:
- Deliberate (not accidental)
- Documented (explain WHY the change)
- Reviewed (validated against RULES.md)

---

## POST-CLEANUP VALIDATION (MANDATORY)

After removing all POC artifacts, verify:

### Code Cleanup
- [ ] No remaining references to `accounts` in any source file (except auth.permissions seed if intentional)
- [ ] No remaining references to `contacts` in any source file
- [ ] No remaining POC migration files in `drizzle/`
- [ ] No remaining POC test files in `tests/`
- [ ] No remaining POC pages in `src/app/[locale]/`
- [ ] No remaining POC API routes in `src/app/api/v1/`
- [ ] No remaining POC validators in `src/lib/validators/`
- [ ] No remaining POC form components in `src/components/forms/`
- [ ] No remaining POC SVGs in `public/`
- [ ] No remaining POC translation keys in `messages/`

### Build & Quality
- [ ] `npm run lint` passes with zero errors, zero warnings
- [ ] `npm run typecheck` passes (no TypeScript errors)
- [ ] `npm run test` passes (all remaining tests green)
- [ ] `npm run build` succeeds without errors

### Immutable Files
- [ ] `.agents/` directory completely untouched
- [ ] `.claude/` directory completely untouched
- [ ] `CLAUDE.md` untouched
- [ ] `RULES.md` untouched
- [ ] `.githooks/` untouched
- [ ] `.github/` untouched

### Documentation
- [ ] `README.md` reflects the real project, not the template
- [ ] `.env.example` reflects the real project's needs
- [ ] No documentation references to POC entities remain

---

## QUICK REFERENCE: DELETE LIST

Copy-paste these paths to verify everything is removed:

```
# Database
src/lib/db/schema/index.ts                    # Remove accounts + contacts table defs
src/lib/db/seed.ts                            # Remove POC seed data
drizzle/0000_amusing_scrambler.sql            # Remove (regenerate after)
drizzle/meta/0000_snapshot.json               # Remove (regenerate after)

# API Routes
src/app/api/v1/accounts/                      # Entire directory
src/app/api/v1/contacts/                      # Entire directory

# Validators
src/lib/validators/account.ts                 # Entire file
src/lib/validators/contact.ts                 # Entire file

# Frontend Pages
src/app/[locale]/(authenticated)/accounts/    # Entire directory
src/app/[locale]/(authenticated)/contacts/    # Entire directory

# Components
src/components/forms/account-form.tsx         # Entire file
src/components/forms/contact-form.tsx         # Entire file

# Tests
tests/api/accounts.test.ts                    # Entire file
tests/api/contacts.test.ts                    # Entire file
tests/api/contacts-id.test.ts                 # Entire file

# Assets
public/window.svg                             # Entire file
public/vercel.svg                             # Entire file
public/next.svg                               # Entire file
public/globe.svg                              # Entire file
public/file.svg                               # Entire file

# RBAC Types
src/lib/auth/rbac.ts                          # Remove POC permission types

# Translations
messages/en.json                              # Remove accounts.* + contacts.* keys
messages/ar.json                              # Remove accounts.* + contacts.* keys
```

---

## COMMON MISTAKES

1. **Deleting tests/schema.test.ts** — This tests the infrastructure tables (users, roles, permissions). KEEP IT but update it to test your real entity schemas.
2. **Deleting tests/api/auth.test.ts** — This tests auth flows. KEEP IT.
3. **Deleting src/lib/api/responses.ts** — This is infrastructure, not POC. KEEP IT.
4. **Deleting src/lib/observability/logger.ts** — Infrastructure. KEEP IT.
5. **Deleting src/lib/db/schema/index.ts entirely** — This file should contain your real project schemas after removing the POC tables. KEEP the file, remove only the POC table definitions.
6. **Forgetting to update RBAC types** — The `PermissionType` union in `src/lib/auth/rbac.ts` must be updated to remove POC permissions and add real ones.
7. **Forgetting to regenerate migrations** — After removing POC schema entries, run `npm run db:generate` to create fresh migrations for your real entities.
8. **Deleting .agents/ or .claude/ files** — These are permanent. Never touch them.

---

## REVERSIBILITY

POC cleanup is designed to be final. However, if a mistake is made:

1. **Git revert:** `git checkout -- <path>` to restore deleted files
2. **Template reference:** Clone the original template again and copy files over
3. **Migration recovery:** Run `npx supabase db reset` to reset the local database, then re-apply migrations

---

## VALIDATION CHECKLIST

Before declaring POC cleanup complete:

- [ ] All POC database entities removed (schema, seed, migrations)
- [ ] All POC API routes removed
- [ ] All POC validators removed
- [ ] All POC frontend pages removed
- [ ] All POC components removed
- [ ] All POC SVGs and demo assets removed
- [ ] All POC test files removed
- [ ] All POC translation keys removed
- [ ] POC permission types removed from RBAC union
- [ ] Real project entities, pages, APIs, and tests are fully functional
- [ ] `.agents/` directory completely untouched
- [ ] `.claude/` directory completely untouched
- [ ] `CLAUDE.md` untouched
- [ ] `RULES.md` untouched
- [ ] `npm run lint` passes after cleanup
- [ ] `npm run test` passes after cleanup
- [ ] `npm run build` succeeds after cleanup
- [ ] Smoke test scripts updated for new entities
