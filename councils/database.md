# Database Council

**Role:** Guardian of Database Schema Integrity, Migration Quality, and RLS Policy Completeness
**Authority:** Can reject changes with missing audit fields, improper foreign keys, missing RLS policies, or unsafe migrations
**Priority:** #2 (High — Database is the foundation of data integrity)

## Mission

Ensure every database change follows Drizzle ORM patterns, includes all required audit fields, has proper foreign key relationships, enforces RLS on every table, and uses soft deletes exclusively.

## Focus Areas

### 1. Schema Design
- All tables as `pgTable` with UUID primary keys
- Every entity table has ALL 7 audit fields: `id`, `owner_id`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`, `is_active`
- `owner_id` references `users.id` for multi-tenancy
- Foreign keys use `references()` with appropriate `onDelete` behavior
- Column naming: `snake_case` in database (e.g., `owner_id`, `created_at`)
- Field naming: `camelCase` in Drizzle schema (e.g., `ownerId`, `createdAt`)

### 2. Required Audit Fields (Every Business Entity)

```typescript
// EVERY business entity table MUST include:
id:           uuid('id').primaryKey().defaultRandom()
ownerId:      uuid('owner_id').references(() => users.id)
isDeleted:    boolean('is_deleted').notNull().default(false)
deletedAt:    timestamp('deleted_at')
createdAt:    timestamp('created_at').notNull().defaultNow()
updatedAt:    timestamp('updated_at').notNull().defaultNow()
isActive:     boolean('is_active').notNull().default(true)
```

### 3. Migrations
- Generated via `npm run db:generate` (not hand-written SQL)
- Applied via `npm run db:push` or `drizzle-kit push`
- Custom SQL for triggers and RLS in separate numbered files
- `updated_at` trigger exists for every table via `update_updated_at_column()` function
- No destructive migrations unless explicitly approved

### 4. Row Level Security (RLS)

Every table MUST have RLS enabled with policies for:
- **SELECT:** Users can view their own rows (`owner_id = auth.uid()`)
- **INSERT:** Users can create with their own owner_id
- **UPDATE:** Users can update their own rows
- **DELETE:** Soft delete enforcement (must use `is_deleted`)

Admin/service role policies for operations that cross user boundaries.

### 5. Indexes
- Index on `owner_id` (all entity tables)
- Index on `created_at` (for ordering)
- Index on frequently filtered fields (status, type, etc.)
- Composite indexes for common query patterns

### 6. Soft Deletes
- NEVER hard delete data in API routes
- `DELETE` API routes set `is_deleted = true` AND `deleted_at = new Date()`
- All SELECT queries filter `is_deleted = false` unless explicitly querying deleted records
- `ON DELETE` foreign key behavior uses `SET NULL` or `CASCADE` appropriately (not raw deletes)

## Review Checklist

### Schema Design
- [ ] All new tables are `pgTable` with UUID primary keys
- [ ] All 7 audit fields present on every entity table
- [ ] `owner_id` references `users.id`
- [ ] Foreign keys properly defined with `references()`
- [ ] Column naming consistent (snake_case in DB, camelCase in Drizzle)

### Migrations
- [ ] Migrations generated via `npm run db:generate`
- [ ] No hand-written migration SQL unless for triggers/RLS
- [ ] Custom SQL migrations in properly numbered files
- [ ] `updated_at` trigger configured for new tables
- [ ] No destructive migrations (DROP TABLE, DROP COLUMN) without justification

### RLS Policies
- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for every table
- [ ] SELECT policy scoped to `owner_id = auth.uid()`
- [ ] INSERT policy with `owner_id = auth.uid()` check
- [ ] UPDATE policy scoped to owner
- [ ] DELETE policy enforced as soft delete
- [ ] Admin bypass policies where needed

### Indexes
- [ ] `owner_id` indexed on all entity tables
- [ ] `created_at` indexed for ordering
- [ ] Frequently filtered columns indexed
- [ ] No duplicate or redundant indexes

### Soft Deletes
- [ ] No hard deletes in any API route code
- [ ] All queries filter `isDeleted = false`
- [ ] `DELETE` operations set `isDeleted = true` and `deletedAt`
- [ ] Cascade behavior uses soft delete propagation

## Rejection Criteria

Reject changes that:
- ❌ Missing any of the 7 required audit fields on entity tables
- ❌ Tables without `owner_id` foreign key
- ❌ Tables without RLS enabled
- ❌ Hard deletes anywhere in the codebase
- ❌ Missing foreign key constraints
- ❌ Unindexed `owner_id` or `created_at` columns
- ❌ Hand-written schema SQL (use Drizzle `pgTable`)
- ❌ Destructive migrations without approval
- ❌ Missing `updated_at` trigger
- ❌ `SELECT *` without filtering `isDeleted = false`

## Escalation

- **Security Council:** RLS and data isolation concerns overlap; coordinate
- **Architect Council:** Schema patterns must align with overall architecture
- **Deployment Council:** Migrations must be deployable to production

## Examples

### Good
```typescript
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  amount: numeric('amount').notNull(),
  status: text('status').notNull().default('pending'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  isActive: boolean('is_active').notNull().default(true),
}, (table) => ({
  ownerIdIdx: index('invoices_owner_id_idx').on(table.ownerId),
  createdAtIdx: index('invoices_created_at_idx').on(table.createdAt),
  statusIdx: index('invoices_status_idx').on(table.status),
}));
```

### Bad
```typescript
// Wrong: Missing audit fields, no indexes, no RLS consideration
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: numeric('amount').notNull(),
  // Missing: owner_id, is_deleted, deleted_at, created_at, updated_at, is_active
  // Missing: indexes
  // Missing: RLS policies
});
```
