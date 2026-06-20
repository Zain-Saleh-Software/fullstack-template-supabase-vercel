# Bootstrap Project Skill — Full Project Migration Workflow

**Description:** Complete AI workflow for migrating an existing project (any tech stack, any state — from prototype to production) into this Vercel + Supabase template. Handles database migration, data preservation, 1:1 UI replication, feature parity, auth migration, integration mapping, testing, and deployment — all while enforcing every rule, skill, and council in the template.

**Role:** The Architect (orchestrates) + The Executor (implements) + The Reviewer (validates)

**Trigger:** User says `/bootstrap-project`, "migrate my project", "bootstrap from existing project", "port my app to this template"

---

## CRITICAL MANDATES (Read Before Starting)

### Zero Data Loss
This template enforces soft deletes, audit fields, and RLS. When migrating data from a source project:
- **NEVER** lose or alter source data during migration
- Always generate idempotent migration scripts (safe to re-run)
- Create backups of source data before migration
- Validate row counts match post-migration
- All tables get 7 audit fields; existing data gets sensible defaults

### 1:1 User Experience
End users of the migrated project MUST NOT notice any difference:
- Every page, route, and URL structure preserved (or transparently redirected)
- Every UI component visually identical (pixel-perfect where possible)
- Every form behavior, validation message, and workflow preserved
- Every API endpoint returns the same shape (or a documented upgrade path)
- Auth flows feel identical (login, register, password reset, session management)

### Template Rule Enforcement
Every piece of migrated code MUST comply with every rule from `RULES.md`, every pattern from `skills/`, and pass every review from `councils/`. This is non-negotiable.

### Immutable Infrastructure
`.agents/`, `.claude/`, `CLAUDE.md`, `RULES.md`, `.githooks/`, `.github/workflows/` are immutable. Never touch them. `skills/` and `councils/` evolve deliberately.

---

## PRE-FLIGHT: Session Setup

Before starting the migration:

1. **Read `CLAUDE.md`** completely
2. **Read `RULES.md`** completely
3. **Verify branch:** `git checkout develop`
4. **Check state:** `git status` and `git log --oneline -5`
5. **Load all 17 skill files** for reference (listed in PHASE 0 below)
6. **Load all 11 council files** for validation gates

---

## PHASE 0: SOURCE PROJECT DISCOVERY & ANALYSIS

### 0.1 Accept the Source

The user provides ONE of the following:
- **Path** to an existing project on disk
- **Git URL** to clone the source project
- **Project description/summary** (English description of what the project does)
- **PRD or spec document** describing the project

If a path/URL is provided, clone/copy the source to a temporary location. NEVER modify the source project.

### 0.2 Comprehensive Source Inventory

Read and catalog EVERYTHING from the source project. Produce a structured inventory:

#### A. Tech Stack Audit
```
- Framework: [Next.js / React / Vue / Angular / Svelte / Express / Django / Rails / Laravel / etc.]
- Language: [TypeScript / JavaScript / Python / Ruby / PHP / etc.]
- Database: [PostgreSQL / MySQL / MongoDB / SQLite / etc.]
- ORM: [Prisma / Sequelize / Mongoose / SQLAlchemy / ActiveRecord / raw SQL / etc.]
- Auth: [Supabase Auth / NextAuth / Clerk / Auth0 / Firebase Auth / custom JWT / etc.]
- Styling: [Tailwind / CSS Modules / styled-components / Material UI / Bootstrap / etc.]
- State: [Redux / Zustand / React Query / Apollo / Context / etc.]
- Forms: [react-hook-form / Formik / native / etc.]
- Hosting: [Vercel / AWS / Heroku / DigitalOcean / etc.]
- Third-party integrations: [Stripe / SendGrid / Twilio / Slack / etc.]
```

#### B. Database Inventory
For every table/collection in the source:
- Table name, columns, types, constraints, indexes
- Foreign key relationships
- Row count (to validate post-migration)
- Any triggers, stored procedures, views
- Seed data or initial data

#### C. API Inventory
For every endpoint in the source:
- Method, path, request body shape, response shape
- Auth requirements (public, authenticated, role-based)
- Pagination pattern used
- Error response format

#### D. Frontend Inventory
For every page/route in the source:
- URL path, page title, purpose
- Server-side data dependencies
- Client-side interactivity (forms, modals, real-time)
- Components used
- Translations/locales supported

#### E. Auth Inventory
- User model (fields, how passwords are stored)
- Roles and permissions (what exists)
- Session/token management
- OAuth providers configured
- Password reset flow
- Email verification flow

#### F. Environment & Configuration
- All environment variables (with descriptions)
- Third-party API keys needed
- Build/deploy configuration
- Webhook endpoints
- Cron jobs / scheduled tasks
- File storage (S3, Cloudinary, local)

#### G. Business Logic Inventory
- Core business rules and validations
- Complex workflows (multi-step processes)
- Event-driven logic (webhooks, queues)
- Scheduled jobs
- Email templates
- PDF generation
- Reporting logic

### 0.3 Entity Mapping

Map every source entity to a target Drizzle entity. Create an entity mapping table:

| Source Entity | Source Table | Target Table Name | New Fields Added | Notes |
|--------------|-------------|-------------------|------------------|-------|
| User | users | users | is_active, is_deleted, deleted_at, owner_id | Already exists in template |
| Product | products | products | 7 audit fields | Renamed from items |
| etc. | | | | |

Map every source permission to the `resource:action` format:

| Source Permission | Target Permission | Notes |
|------------------|-------------------|-------|
| admin | role:admin + all *:* permissions | Superuser role |
| can_edit_products | product:update | RBAC permission |
| etc. | | |

### 0.4 Route Mapping

Map every source URL to the target `/[locale]/` pattern:

| Source URL | Target URL | Notes |
|-----------|-----------|-------|
| /dashboard | /en/(authenticated)/dashboard | Locale-prefixed |
| /api/products | /api/v1/products | Versioned API |
| /login | /en/login | Auth pages |
| etc. | | |

### 0.5 Produce Migration Plan (Share with User)

Before writing ANY code, present the user with a summary:
- Detected tech stack and migration path
- Number of entities, API routes, frontend pages to migrate
- Data volume (row counts)
- Identified risks (complex migrations, data transformations needed)
- Auth migration strategy
- Estimated scope

**Ask:** "I've analyzed your project. Here's what I found. Should I proceed with the full migration? (y/n)"

---

## PHASE 1: DATABASE MIGRATION (ZERO DATA LOSS)

> **Load skill:** `skills/database.md` — Schema patterns, migrations, queries, RLS
> **Invoke councils:** Database Council, Security Council

### 1.1 Remove POC Entities

Per `skills/poc-cleanup.md`, remove POC tables from `src/lib/db/schema/index.ts`:
- Remove `accounts` table definition
- Remove `contacts` table definition
- Keep infrastructure tables: `users`, `roles`, `permissions`, `events`, `tableChanges`

### 1.2 Define New Drizzle Schemas

For each entity from the source project, create a `pgTable` definition in `src/lib/db/schema/index.ts`:

```typescript
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  // ... source entity fields, mapped to snake_case ...
  name: text("name").notNull(),
  price: numeric("price"),
  status: text("status").default("active").notNull(),
  // 7 required audit fields:
  isActive: boolean("is_active").default(true).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ownerIdIdx: index("products_owner_id_idx").on(table.ownerId),
  createdAtIdx: index("products_created_at_idx").on(table.createdAt),
}));
```

**Rules enforced:**
- [ ] UUID primary keys on all tables
- [ ] All 7 audit fields on every entity table
- [ ] `owner_id` references `users.id` for multi-tenancy
- [ ] Indexes on `owner_id`, `created_at`, and frequently queried fields
- [ ] Snake_case column names in DB, camelCase in Drizzle
- [ ] Foreign keys with `references()` and appropriate `onDelete`
- [ ] Soft deletes only (no hard deletes)

### 1.3 Generate Migration

```bash
npm run db:generate
```

This creates a new migration file in `drizzle/` with the schema changes.

### 1.4 Create Data Migration Script

Create `scripts/migrate-data.ts` for zero-data-loss migration. This script:

```typescript
// scripts/migrate-data.ts — DATA MIGRATION SCRIPT
// Connects to BOTH source and target databases
// Migrates data row-by-row with validation
// Idempotent — safe to re-run

import { db as targetDb } from "@/lib/db";
import { products, /* ... */ } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/observability/logger";

// 1. Connect to source database
// 2. For each table: SELECT * FROM source_table
// 3. Transform data: map fields, add audit defaults, handle type conversions
// 4. INSERT INTO target_table with ON CONFLICT DO NOTHING
// 5. Validate: compare row counts
// 6. Log migration results
```

**Key migration rules:**
- **Idempotent:** Use `ON CONFLICT (id) DO UPDATE` or `ON CONFLICT DO NOTHING` so re-runs are safe
- **Batch inserts:** Process in batches (500-1000 rows at a time) for large tables
- **Foreign key ordering:** Migrate parent tables before child tables (users → roles → entities)
- **Data transformation:** Map source field names to target, apply type conversions
- **Audit field defaults:** New fields get sensible defaults (`is_active = true`, `is_deleted = false`, `created_at = NOW()`)
- **Validation:** After migration, compare row counts between source and target
- **Logging:** Log every table migration with before/after counts

### 1.5 Apply Migrations + Run Data Migration

```bash
# Apply schema migrations
npm run db:push

# Run data migration
npx tsx scripts/migrate-data.ts

# Validate row counts
npx tsx scripts/validate-migration.ts
```

### 1.6 Generate RLS Policies

Create `drizzle/NNNN_rls_policies.sql` with RLS policies for every entity table:

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- SELECT: Users see their own rows
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (owner_id = auth.uid());

-- INSERT: Users create with their own owner_id
CREATE POLICY "Users can create own products" ON products
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- UPDATE: Users update their own rows
CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (owner_id = auth.uid());

-- DELETE: Soft delete enforcement
CREATE POLICY "Users can soft delete own products" ON products
  FOR UPDATE USING (owner_id = auth.uid());
```

Also create `updated_at` triggers for every table:

```sql
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 1.7 Create Database Seed Script

Update `src/lib/db/seed.ts` to seed initial data (roles, permissions, default entities):

```typescript
// Seed roles and permissions for the new project
await db.insert(roles).values([
  { name: "Admin", description: "Full system access", isSystem: true },
  { name: "Manager", description: "Manager access", isSystem: false },
]).onConflictDoNothing();

await db.insert(permissions).values([
  { roleId: adminRole.id, resource: "*", action: "*" },
  { roleId: managerRole.id, resource: "product", action: "read" },
  { roleId: managerRole.id, resource: "product", action: "create" },
  // ... etc
]).onConflictDoNothing();
```

### Phase 1 Validation

- [ ] All POC tables removed from schema
- [ ] All source entities defined as Drizzle pgTable
- [ ] All 7 audit fields on every entity table
- [ ] Foreign keys and indexes defined
- [ ] Migration generated and applied (`npm run db:push`)
- [ ] Data migration script runs successfully (idempotent)
- [ ] Row counts validated (source == target)
- [ ] RLS policies generated for all tables
- [ ] `updated_at` triggers exist for all tables
- [ ] Seed script populates initial roles/permissions
- [ ] `npm run db:studio` opens and shows all tables
- [ ] Database Council review: ✅ Approved
- [ ] Security Council review: ✅ Approved

---

## PHASE 2: AUTH & RBAC MIGRATION

> **Load skill:** `skills/auth-rbac.md` — Supabase Auth, RBAC engine, permission gates
> **Load skill:** `skills/environment.md` — Env var management
> **Invoke councils:** Security Council, Architect Council

### 2.1 Migrate Users to Supabase Auth

**If source uses Supabase Auth:** Verify auth configuration matches. No migration needed.

**If source uses other auth (NextAuth, Clerk, Auth0, custom JWT, etc.):**

Create `scripts/migrate-users-to-supabase.ts`:

```typescript
// 1. For each source user:
//    a. Create Supabase Auth user via Admin API (or generate invite)
//    b. Map user profile fields to template users table
//    c. Preserve original user ID or map to new UUID
// 2. Handle password migration strategy:
//    a. Option A: Force password reset (send invite emails)
//    b. Option B: Custom migration — store old hash, validate on first login
// 3. Preserve all user data (profile, preferences, metadata)
```

**Password migration strategy:** Inform the user of options:
- **Recommended:** Force password reset via Supabase invite emails (most secure, simplest)
- **Alternative:** Use Supabase custom access token hook to validate legacy passwords, then upgrade to Supabase Auth on first successful login

### 2.2 Migrate Roles & Permissions

Map source roles to template RBAC:

```typescript
// In src/lib/db/seed.ts or migration script:
// 1. For each source role → create role in template
// 2. For each source permission → create permission using resource:action format
// 3. Map users to their roles (update users.role_id)
```

### 2.3 Update RBAC Permission Types

In `src/lib/auth/rbac.ts`, replace POC permissions with real project permissions:

```typescript
export type PermissionType =
  // System Administration
  | "system:read"
  | "system:write"
  // Users & Roles
  | "user:read"
  | "user:write"
  | "user:delete"
  | "role:read"
  | "role:write"
  // Project-specific permissions
  | "product:read"
  | "product:create"
  | "product:update"
  | "product:delete"
  // ... all real entity permissions
```

**Rules enforced:**
- [ ] All permissions use `resource:action` format
- [ ] Superusers bypass all checks (`is_superuser = true`)
- [ ] No custom auth logic (Supabase Auth exclusively)
- [ ] No hardcoded permissions in code

### 2.4 Configure Supabase Auth Settings

- Auth redirect URLs (include Vercel preview + production domains)
- Email templates (if using Supabase email)
- OAuth providers (if source uses Google, GitHub, etc.)
- SMTP settings (if using custom email provider)

### Phase 2 Validation

- [ ] All users migrated to Supabase Auth
- [ ] User profiles preserved in `users` table
- [ ] Password reset flow configured (if using force-reset)
- [ ] All roles created and populated
- [ ] All permissions defined in `resource:action` format
- [ ] User-to-role assignments preserved
- [ ] RBAC type union updated with all project permissions
- [ ] Supabase Auth callback URLs configured
- [ ] Login/register/logout flows work
- [ ] Security Council review: ✅ Approved

---

## PHASE 3: API ROUTE MIGRATION

> **Load skill:** `skills/api-design.md` — Route structure, responses, validation
> **Load skill:** `skills/error-handling.md` — Error patterns, boundaries
> **Load skill:** `skills/typescript.md` — Type safety, Zod inference
> **Invoke councils:** API Design Council, Security Council, Quality Council, Testing Council

### 3.1 Map Source Endpoints to Template Routes

For every source API endpoint, create a corresponding route in `src/app/api/v1/[entity]/route.ts` and `src/app/api/v1/[entity]/[id]/route.ts`:

| Source | Target | Method |
|--------|--------|--------|
| GET /api/products | src/app/api/v1/products/route.ts | GET |
| POST /api/products | src/app/api/v1/products/route.ts | POST |
| GET /api/products/:id | src/app/api/v1/products/[id]/route.ts | GET |
| PATCH /api/products/:id | src/app/api/v1/products/[id]/route.ts | PATCH |
| DELETE /api/products/:id | src/app/api/v1/products/[id]/route.ts | DELETE |

### 3.2 Create Zod Validation Schemas

For every entity, create schemas in `src/lib/validators/[entity].ts`:

```typescript
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  price: z.number().positive("Price must be positive"),
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  // ... all source fields with validation
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
```

**Rules enforced:**
- [ ] ALL Zod schemas in `src/lib/validators/` (never inline in routes)
- [ ] Types derived from schemas using `z.infer<>`
- [ ] `.safeParse()` in routes (not `.parse()`)
- [ ] Validation errors returned with helpful details

### 3.3 Create Standardized API Routes

Every route follows the EXACT pattern from `skills/api-design.md`:

```typescript
// src/app/api/v1/products/route.ts
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { requirePermission } from "@/lib/auth/rbac";
import { createProductSchema } from "@/lib/validators/product";
import { apiError, getPaginationParams, paginatedResponse } from "@/lib/api/responses";
import { logger } from "@/lib/observability/logger";
import { eq, desc, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("product:read");
    const { limit, offset } = getPaginationParams(request.nextUrl);
    const items = await db.select()
      .from(products)
      .where(eq(products.isDeleted, false))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isDeleted, false));
    return paginatedResponse(items, Number(count), limit, offset);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Forbidden")) return apiError("Forbidden", "FORBIDDEN", 403);
      logger.error("List products error", { error: error.message });
    }
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("product:create");
    const body = await request.json();
    const result = createProductSchema.safeParse(body);
    if (!result.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, result.error.flatten());
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const [product] = await db.insert(products)
      .values({ ...result.data, ownerId: user?.id })
      .returning();
    logger.info("Product created", { productId: product.id, actorId: user?.id });
    return new Response(JSON.stringify(product), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Forbidden")) return apiError("Forbidden", "FORBIDDEN", 403);
      logger.error("Create product error", { error: error.message });
    }
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
```

**Single-resource route** (`src/app/api/v1/products/[id]/route.ts`):

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("product:read");
    const { id } = await params;
    const [item] = await db.select().from(products)
      .where(and(eq(products.id, id), eq(products.isDeleted, false)));
    if (!item) return apiError("Not found", "NOT_FOUND", 404);
    return new Response(JSON.stringify(item), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Forbidden")) return apiError("Forbidden", "FORBIDDEN", 403);
      logger.error("Get product error", { error: error.message });
    }
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("product:update");
    const { id } = await params;
    const body = await request.json();
    const result = updateProductSchema.safeParse(body);
    if (!result.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, result.error.flatten());
    }
    const [updated] = await db.update(products)
      .set(result.data)
      .where(and(eq(products.id, id), eq(products.isDeleted, false)))
      .returning();
    if (!updated) return apiError("Not found", "NOT_FOUND", 404);
    logger.info("Product updated", { productId: id });
    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Forbidden")) return apiError("Forbidden", "FORBIDDEN", 403);
      logger.error("Update product error", { error: error.message });
    }
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// DELETE = soft delete (set is_deleted = true, never hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("product:delete");
    const { id } = await params;
    const [deleted] = await db.update(products)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.isDeleted, false)))
      .returning();
    if (!deleted) return apiError("Not found", "NOT_FOUND", 404);
    logger.info("Product soft-deleted", { productId: id });
    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Forbidden")) return apiError("Forbidden", "FORBIDDEN", 403);
      logger.error("Delete product error", { error: error.message });
    }
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
```

**Rules enforced per route:**
- [ ] `requirePermission()` before ANY data operation
- [ ] Zod `.safeParse()` on all POST/PATCH request bodies
- [ ] `catch (error: unknown)` with `instanceof Error` narrowing
- [ ] `apiError()` for all error responses (never raw errors)
- [ ] `paginatedResponse()` for all GET list endpoints
- [ ] `logger` for all key operations (never `console.log`)
- [ ] Soft deletes on DELETE (set `isDeleted = true`, `deletedAt = new Date()`)
- [ ] `isDeleted = false` filter on all read queries
- [ ] Drizzle ORM exclusively (no raw SQL in routes)
- [ ] `params: Promise<{ id: string }>` for dynamic routes (Next.js 15+)
- [ ] Explicit return types

### 3.4 Handle Non-CRUD Endpoints

If the source has custom endpoints (search, bulk operations, reports, webhooks, file uploads):

**Search endpoint:** `GET /api/v1/products/search?q=term` — add to existing route file as a query parameter handler.

**Bulk operations:** Create `POST /api/v1/products/bulk` — follow the same patterns (requirePermission, Zod validation, error handling).

**File uploads:** Use Supabase Storage with proper bucket RLS policies. API route validates file type/size, uploads to Supabase Storage, returns URL.

**Webhooks:** Create `src/app/api/v1/webhooks/[service]/route.ts` — validate webhook signatures, process async, return 200 quickly.

**Reports/Exports:** Create dedicated endpoints; stream large responses; use database-level aggregation for performance.

### 3.5 Preserve Response Shapes for Backward Compatibility

If the source project has external API consumers (mobile apps, third-party integrations), preserve the response shape exactly:

```typescript
// Option A: Return exact same shape as source
return new Response(JSON.stringify({
  id: item.id,
  name: item.name,
  price: item.price,
  // ... exact source fields
}), { status: 200 });

// Option B: Add _upgrade metadata to inform consumers
return new Response(JSON.stringify({
  data: item,                         // new shape
  _legacy: { field: item.newField },  // backward-compatible mapping
  _version: "v1",
}), { status: 200 });
```

### Phase 3 Validation

- [ ] All source endpoints have corresponding template routes
- [ ] Zod validation schemas created for every entity in `src/lib/validators/`
- [ ] All routes call `requirePermission()` before data operations
- [ ] All routes use `catch (error: unknown)` pattern
- [ ] All routes use `apiError()` and `paginatedResponse()` helpers
- [ ] Soft deletes on all DELETE routes
- [ ] `isDeleted = false` filtered on all reads
- [ ] API responses are backward-compatible (if external consumers exist)
- [ ] `logger` used for all operations (no `console.log`)
- [ ] API Design Council review: ✅ Approved
- [ ] Security Council review: ✅ Approved

---

## PHASE 4: FRONTEND MIGRATION (1:1 UI REPLICATION)

> **Load skill:** `skills/frontend.md` — Components, Tailwind v4, dark mode, state
> **Load skill:** `skills/i18n.md` — Translations, locale routing
> **Load skill:** `skills/accessibility.md` — ARIA, semantic HTML, keyboard nav
> **Load skill:** `skills/error-handling.md` — Error boundaries, loading states
> **Load skill:** `skills/seo-metadata.md` — Metadata, OG images
> **Load skill:** `skills/code-quality.md` — File/function limits, naming
> **Invoke councils:** Frontend Council, Quality Council, Architect Council

### 4.1 Map Source Pages to Template Routes

For every page in the source project:

| Source Route | Target Route (Next.js App Router) |
|-------------|-----------------------------------|
| / | src/app/[locale]/page.tsx (home/landing) |
| /login | src/app/[locale]/login/page.tsx |
| /register | src/app/[locale]/register/page.tsx |
| /dashboard | src/app/[locale]/(authenticated)/dashboard/page.tsx |
| /products | src/app/[locale]/(authenticated)/products/page.tsx |
| /products/new | src/app/[locale]/(authenticated)/products/new/page.tsx |
| /products/:id | src/app/[locale]/(authenticated)/products/[id]/page.tsx |
| /products/:id/edit | src/app/[locale]/(authenticated)/products/[id]/edit/page.tsx |

### 4.2 Component Architecture

Organize EVERY migrated component into the atomic structure:

```
src/components/
├── ui/            ← Primitives: Button, Input, Card, Badge, Modal, Skeleton, Table
├── forms/         ← Form components: FormInput, FormSelect, FormTextarea
├── layout/        ← Layout: Sidebar, Header, Shell, Navigation
└── [feature]/     ← Domain: ProductTable, ProductCard, InvoiceForm
```

### 4.3 Migrate UI Components (1:1 Visual Fidelity)

For every UI component in the source:

**Pattern: Convert any styling to Tailwind v4 + dark mode:**

```tsx
// Source (any framework): 
// <div class="card"> → <Card> with Tailwind classes

// Target (Next.js + Tailwind v4):
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm p-6",
      className
    )}>
      {children}
    </div>
  );
}
```

**Migrate all source components with these rules:**
- Server Components by default; `"use client"` ONLY for hooks/interactivity
- All colors support dark mode (`.dark:` variants)
- Use `cn()` from `@/lib/utils` for conditional classes
- Semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<section>`)
- ARIA labels on all interactive elements
- `next/image` for all images (with width, height, alt)
- Form labels on all inputs
- Under 300 lines per file, under 50 lines per function

### 4.4 State Management Migration

Map source state management to template patterns:

| Source Pattern | Template Pattern |
|---------------|-----------------|
| Redux | Remove — use React Query + Context |
| MobX | Remove — use React Query + Context |
| Zustand (global) | React Context API |
| Zustand (server state) | TanStack Query |
| React Query | TanStack Query (same pattern) |
| Apollo Client | TanStack Query (REST to REST) |
| useState/useReducer | Keep as-is |
| React Hook Form | Keep (already the standard) |

### 4.5 Data Fetching Strategy

Convert ALL source data fetching to the template pattern:

**Server Components (default):** Fetch directly from Drizzle:

```tsx
// Server Component — preferred pattern
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const items = await db.select().from(products)
    .where(and(eq(products.ownerId, user!.id), eq(products.isDeleted, false)))
    .orderBy(desc(products.createdAt));
  
  return <ProductList initialData={items} />;
}
```

**Client Components (interactivity):** Use React Query:

```tsx
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function ProductList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetch("/api/v1/products").then(r => r.json()),
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/v1/products/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
  
  // ... render with loading, error, empty states
}
```

### 4.6 Form Migration

Every form uses `react-hook-form` + Zod:

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema, type CreateProductInput } from "@/lib/validators/product";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

export function ProductForm() {
  const t = useTranslations("products");
  const queryClient = useQueryClient();
  
  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { name: "", price: 0, status: "draft" },
  });
  
  const mutation = useMutation({
    mutationFn: (data: CreateProductInput) => fetch("/api/v1/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      form.reset();
    },
  });
  
  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
      <div>
        <label htmlFor="name">{t("name")}</label>
        <input id="name" {...form.register("name")} />
        {form.formState.errors.name && (
          <p role="alert" className="text-red-600">{form.formState.errors.name.message}</p>
        )}
      </div>
      {/* ... */}
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? t("saving") : t("create")}
      </button>
    </form>
  );
}
```

### 4.7 Permission Gates on UI

Wrap every protected action with `<PermissionGate>`:

```tsx
<PermissionGate permission="product:create">
  <Button href="/products/new">{t("createProduct")}</Button>
</PermissionGate>

<PermissionGate permission="product:delete">
  <DeleteButton onConfirm={() => deleteMutation.mutate(productId)} />
</PermissionGate>
```

### 4.8 i18n Migration

If the source has translations:
1. Extract all user-facing strings
2. Map to `messages/en.json` with proper nesting
3. Translate to `messages/ar.json` (Arabic)
4. Replace all hardcoded strings with `useTranslations()` / `getTranslations()`

If the source is single-language:
1. Create `messages/en.json` with all strings
2. Create `messages/ar.json` skeleton (user fills in translations later)

```json
// messages/en.json
{
  "products": {
    "title": "Products",
    "create": "Create Product",
    "edit": "Edit Product",
    "delete": "Delete Product",
    "name": "Name",
    "price": "Price",
    "status": "Status",
    "noProducts": "No products found",
    "createFirst": "Create your first product"
  }
}
```

### 4.9 Loading & Error States

Every page needs:
- `loading.tsx` in the page directory
- Error boundaries (via `error.tsx` in layout segments)
- Empty states for lists with no data
- Inline error messages for form validation failures

### 4.10 SEO & Metadata

Add `metadata` export or `generateMetadata()` to every page:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Manage your products",
};
```

### 4.11 Accessibility Audit

For every migrated component, verify:
- [ ] Semantic HTML elements used
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Color contrast meets WCAG AA (4.5:1 normal, 3:1 large)
- [ ] Form inputs have associated labels
- [ ] Images have descriptive alt text
- [ ] Focus management for modals/dialogs

### 4.12 Preserve Exact UI Behavior

To ensure end users notice NO difference:
- Match the exact layout, spacing, and visual hierarchy
- Preserve all interactive behaviors (hover states, transitions, animations)
- Match form validation timing and error display positions
- Preserve all client-side routing transitions
- Match all loading indicators and skeleton screens
- Preserve responsive breakpoints and mobile layouts

### Phase 4 Validation

- [ ] All source pages have corresponding template pages
- [ ] Components follow atomic directory structure
- [ ] Server Components by default; `"use client"` only when needed
- [ ] Tailwind v4 + dark mode on every component
- [ ] `cn()` utility used for conditional classes
- [ ] React Query for server state in client components
- [ ] `react-hook-form` + Zod for all forms
- [ ] `<PermissionGate>` wraps all protected UI elements
- [ ] All user-facing strings use i18n (`useTranslations` / `getTranslations`)
- [ ] RTL support for Arabic locale
- [ ] Semantic HTML and ARIA labels throughout
- [ ] Keyboard navigation works for all interactive elements
- [ ] Color contrast meets WCAG AA
- [ ] Form inputs have associated labels
- [ ] Images have alt text
- [ ] Error boundaries on all layout segments
- [ ] Loading states for all async operations
- [ ] Empty states for lists with no data
- [ ] SEO metadata on all pages
- [ ] Visual appearance matches source 1:1
- [ ] Frontend Council review: ✅ Approved
- [ ] Quality Council review: ✅ Approved

---

## PHASE 5: INTEGRATION MIGRATION

> **Load skill:** `skills/deployment.md` — Vercel setup, CI/CD
> **Load skill:** `skills/observability.md` — Logging, Sentry
> **Load skill:** `skills/environment.md` — Env vars

### 5.1 Third-Party Integrations

For each third-party integration in the source:

| Integration | Migration Strategy |
|------------|-------------------|
| Stripe | Keep Stripe SDK; create API routes in `src/app/api/v1/webhooks/stripe/` |
| SendGrid / Resend | Keep SDK; use in Server Components or API routes |
| Twilio | Keep SDK; create API routes for webhooks |
| Slack | Webhook in API routes |
| Google Maps | Client component with `"use client"` |
| File upload (S3/Cloudinary) | Migrate to Supabase Storage |
| Email templates | Migrate to React Email or Supabase email templates |
| PDF generation | Use in API routes or Server Components |
| Analytics (GA, Mixpanel) | Client component with `"use client"` |
| WebSockets | Use Supabase Realtime |

### 5.2 Environment Variables

Document all source env vars in `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Third-Party (add for each integration)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=
# ... etc
```

**Critical:** No `NEXT_PUBLIC_` prefix on secrets. Only use `NEXT_PUBLIC_` for values safe to expose in the browser.

### 5.3 Sentry Configuration

Update `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` with project-specific Sentry DSN.

### Phase 5 Validation

- [ ] All integrations mapped to template-compatible implementations
- [ ] Environment variables documented in `.env.example`
- [ ] No secrets exposed to client (`NEXT_PUBLIC_` rules followed)
- [ ] Sentry configured for all runtimes
- [ ] Supabase Storage configured for file uploads (if applicable)

---

## PHASE 6: TEST MIGRATION & COVERAGE

> **Load skill:** `skills/testing.md` — Test patterns and coverage
> **Invoke councils:** Testing Council, Quality Council

### 6.1 Migrate Existing Tests

If the source has tests:
1. Convert test framework to Vitest (if different)
2. Update imports to match template paths (@/ alias)
3. Adapt mock patterns to template database mock strategy
4. Ensure all tests pass

### 6.2 Add Template-Required Tests

**For every entity, create:**

#### Schema Shape Test (`tests/db/[entity].test.ts`):

```typescript
import { describe, it, expect } from "vitest";
import { products } from "@/lib/db/schema";

describe("products schema", () => {
  it("has all required audit fields", () => {
    const columns = Object.keys(products);
    expect(columns).toContain("id");
    expect(columns).toContain("ownerId");
    expect(columns).toContain("isDeleted");
    expect(columns).toContain("deletedAt");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
    expect(columns).toContain("isActive");
  });
  
  it("has the expected business fields", () => {
    const columns = Object.keys(products);
    expect(columns).toContain("name");
    expect(columns).toContain("price");
    expect(columns).toContain("status");
  });
});
```

#### API Route Tests (`tests/api/[entity].test.ts`):

Cover all 5 required scenarios per `skills/testing.md`:
- [ ] Happy Path — creates/reads/updates with valid data
- [ ] Validation Errors — invalid/missing data returns 400
- [ ] Permission Errors — unauthorized user gets 403
- [ ] Not Found — non-existent resource returns 404
- [ ] Server Errors — database failure returns 500

### 6.3 Maintain Coverage Thresholds

- [ ] API routes: 90% minimum
- [ ] Database schemas: 100% (structure)
- [ ] Auth/RBAC: 100%
- [ ] Overall: 70% minimum

### Phase 6 Validation

- [ ] All existing source tests migrated and passing
- [ ] Schema shape tests for every entity in `tests/db/`
- [ ] API route tests for every entity in `tests/api/`
- [ ] Tests cover all 5 required scenarios per route
- [ ] Coverage meets all thresholds
- [ ] `npm run test` passes with zero failures
- [ ] Testing Council review: ✅ Approved

---

## PHASE 7: VALIDATION & POC CLEANUP

> **Load skill:** `skills/poc-cleanup.md` — Full cleanup checklist
> **Load skill:** `skills/code-quality.md` — Code quality standards
> **Invoke councils:** Lead Council (orchestrates all 11 councils)

### 7.1 Run Full Council Review

Before declaring migration complete, run EVERY council:

| Council | Status |
|---------|--------|
| Security Council | Check all API routes, auth, data protection |
| Architect Council | Check patterns, tech stack, file structure |
| Database Council | Check schemas, migrations, RLS, indexes |
| API Design Council | Check routes, responses, validation, pagination |
| Testing Council | Check coverage, test structure, test quality |
| Quality Council | Check code style, error handling, docs |
| Frontend Council | Check components, a11y, i18n, dark mode, performance |
| Deployment Council | Check Vercel compatibility, env vars, build |
| Observability Council | Check logging, Sentry, error boundaries |
| GitHub Council | Check branch, commits, immutable files |
| Lead Council | Synthesize all findings |

### 7.2 POC Code Cleanup

Per `skills/poc-cleanup.md`, remove ALL POC artifacts:
- [ ] POC tables from schema (`accounts`, `contacts`)
- [ ] POC API routes (`src/app/api/v1/accounts/`, `src/app/api/v1/contacts/`)
- [ ] POC validators (`account.ts`, `contact.ts`)
- [ ] POC pages (`accounts/`, `contacts/` pages under authenticated)
- [ ] POC components (`account-form.tsx`, `contact-form.tsx`)
- [ ] POC tests (`tests/api/accounts.test.ts`, `tests/api/contacts.test.ts`, `tests/api/contacts-id.test.ts`)
- [ ] POC SVGs (`public/window.svg`, `public/vercel.svg`, `public/next.svg`, `public/globe.svg`, `public/file.svg`)
- [ ] POC permissions from RBAC union (`account:*`, `contact:*`)
- [ ] POC translation keys from `messages/en.json` and `messages/ar.json`
- [ ] POC migration files (`drizzle/0000_amusing_scrambler.sql`, `drizzle/meta/0000_snapshot.json`)
- [ ] POC seed data from `src/lib/db/seed.ts`

**Verify immutable files untouched:**
- [ ] `.agents/` completely untouched
- [ ] `.claude/` completely untouched
- [ ] `CLAUDE.md` untouched
- [ ] `RULES.md` untouched
- [ ] `.githooks/` untouched
- [ ] `.github/workflows/` untouched

### 7.3 Global Build Verification

```bash
# Run all verifications
npm run lint          # ESLint + TypeScript — must pass
npm run typecheck     # TypeScript compilation — must pass
npm run test          # All tests — must pass
npm run build         # Production build — must succeed
npm run validate-rules # Template rule validation
```

### 7.4 User Acceptance Testing

Share the deployed preview URL with the user. Ask them to verify:
- [ ] Login/register works
- [ ] All pages render correctly
- [ ] All forms submit and validate properly
- [ ] All API endpoints respond correctly
- [ ] Dark mode works
- [ ] RTL layout works for Arabic
- [ ] Mobile responsive layout works
- [ ] No visual differences from original project
- [ ] No regressions in functionality

### Phase 7 Validation

- [ ] All 11 councils reviewed and approved
- [ ] All POC code removed
- [ ] Immutable files untouched
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] `npm run validate-rules` passes
- [ ] User acceptance confirmed

---

## PHASE 8: DEPLOYMENT

> **Load skill:** `skills/deployment.md` — Vercel setup, Supabase production

### 8.1 Set Up Vercel Project

1. Push project to GitHub (on `develop` branch)
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard (all from `.env.example`)
4. Deploy preview from `develop`
5. Test preview deployment

### 8.2 Production Supabase Setup

1. Create production Supabase project
2. Apply migrations to production: `npm run db:push` (with production DATABASE_URL)
3. Run data migration script against production
4. Apply RLS policies via SQL Editor
5. Configure auth redirect URLs for production domain

### 8.3 Production Deployment

1. Create PR from `develop` → `main`
2. CI/CD validates (lint, test, build)
3. Merge PR
4. Vercel auto-deploys `main` to production
5. Run smoke tests against production

### 8.4 Post-Deployment Verification

- [ ] Production URL loads
- [ ] Authentication works in production
- [ ] All API routes respond correctly
- [ ] Database operations work
- [ ] RLS policies enforced
- [ ] Sentry receiving errors (if configured)
- [ ] No errors in Vercel function logs
- [ ] Custom domain configured (if applicable)

---

## QUICK REFERENCE: Skill & Council Loading Order

### Skills (Load When You Start the Respective Phase)

| Phase | Skills to Load |
|-------|---------------|
| 0 | None (source analysis is manual) |
| 1 | `database.md` |
| 2 | `auth-rbac.md`, `environment.md` |
| 3 | `api-design.md`, `error-handling.md`, `typescript.md` |
| 4 | `frontend.md`, `i18n.md`, `accessibility.md`, `error-handling.md`, `seo-metadata.md`, `code-quality.md` |
| 5 | `deployment.md`, `observability.md`, `environment.md` |
| 6 | `testing.md` |
| 7 | `poc-cleanup.md`, `code-quality.md` (all councils) |
| 8 | `deployment.md`, `github-workflow.md` |

### Councils (Invoke at End of Each Phase + Final Review)

| Phase | Councils to Invoke |
|-------|-------------------|
| 1 | Database, Security |
| 2 | Security, Architect |
| 3 | API Design, Security, Quality, Testing |
| 4 | Frontend, Quality, Architect |
| 5 | Deployment, Observability |
| 6 | Testing, Quality |
| 7 | Lead (orchestrates ALL 11 councils) |
| 8 | Deployment, GitHub |

---

## TROUBLESHOOTING

### Migration script fails for large datasets
- Increase batch size: process 1000 rows at a time
- Use PostgreSQL `COPY` for bulk imports (faster than INSERT)
- Run migration against a database replica, then promote

### Source uses a NoSQL database (MongoDB, Firestore)
- Map document schemas to relational tables
- Denormalize where necessary; use JSONB columns for flexible data
- Create proper foreign key relationships for document references

### Source uses a different auth system (Clerk, Auth0, Firebase)
- Use Supabase Admin API to create users programmatically
- Send password reset emails to all users
- Map user IDs: store `legacy_user_id` column, update references gradually

### Source has real-time features (WebSockets)
- Use Supabase Realtime (built on PostgreSQL logical replication)
- Subscribe to table changes: `supabase.channel('products').on('postgres_changes', ...)`

### Source has complex queries with joins
- Drizzle supports joins, subqueries, and raw SQL when needed
- Use `drizzle.execute(sql`...`)` for complex analytics queries
- Always parameterize: never interpolate user input into SQL strings

### Performance regressions after migration
- Check database indexes: recreate any missing from source
- Analyze query plans: `EXPLAIN ANALYZE` slow queries
- Use Vercel Analytics to identify slow page loads
- Consider edge caching for static/heavy pages

---

## SUCCESS CRITERIA

The migration is complete when ALL of these are true:

### Functionality
- [ ] Every source feature works identically in the template
- [ ] Every source API endpoint has a corresponding template route
- [ ] All source data migrated with zero loss
- [ ] Auth flows work (login, register, logout, password reset)
- [ ] All integrations working (Stripe, email, etc.)

### User Experience
- [ ] UI is visually identical to the source
- [ ] No URL changes (or transparent redirects)
- [ ] Form behaviors match exactly
- [ ] No performance regressions

### Template Compliance
- [ ] All 17 skills consulted and patterns followed
- [ ] All 11 councils reviewed and approved
- [ ] All RULES.md mandates enforced
- [ ] POC code completely removed
- [ ] Immutable files untouched
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (coverage thresholds met)
- [ ] `npm run build` succeeds
- [ ] Deployed and working in production

---

## CONCLUSION

After completing all 8 phases, inform the user:

1. **Summary:** List what was migrated (X entities, Y API routes, Z pages)
2. **Data:** Confirm row counts match (zero data loss)
3. **Architecture:** Remind them of key template patterns (Server Components, Drizzle, RBAC)
4. **Next Steps:** What the user should do (verify, add translations, configure domains)
5. **Commands:** Key commands they need (`npm run dev`, `npm run db:studio`, `npm run test`)
6. **GitHub:** Remind to push to `develop` and create PR to `main` for production
