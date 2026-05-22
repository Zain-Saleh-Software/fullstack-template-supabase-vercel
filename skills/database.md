# Database Skill (Vercel + Supabase Stack)

**Description:** Patterns for Drizzle ORM schemas, migrations, queries, and RLS policies.
**Role:** The Architect / The Executor

## 1. Schema Definitions

All schemas live in `src/lib/db/schema/index.ts`. Every table MUST be `pgTable` with UUID primary keys.

### Required Audit Fields

Every entity table MUST include:

```typescript
import { pgTable, uuid, boolean, timestamp, text } from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  owner_id: uuid('owner_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  is_deleted: boolean('is_deleted').notNull().default(false),
  deleted_at: timestamp('deleted_at'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  is_active: boolean('is_active').notNull().default(true),
});
```

### Foreign Key References

Always use `references()` for foreign keys. Reference `users.id` for `owner_id`.

## 2. Migrations

```bash
# Generate migration after schema changes
npm run db:generate

# Apply migrations
npm run db:push

# Open Drizzle Studio (visual DB editor)
npm run db:studio
```

### Custom SQL Migrations

For triggers and RLS, create a numbered file in `drizzle/` (e.g., `drizzle/0001_custom_rls_and_triggers.sql`).

```sql
-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 3. Queries

### Select (Server Component)

```typescript
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const allAccounts = await db.select()
  .from(accounts)
  .where(and(
    eq(accounts.owner_id, userId),
    eq(accounts.is_deleted, false)
  ))
  .orderBy(desc(accounts.created_at));
```

### Insert

```typescript
const [newAccount] = await db.insert(accounts)
  .values({ owner_id: userId, name: 'My Account' })
  .returning();
```

### Update (Soft Delete)

```typescript
await db.update(accounts)
  .set({ is_deleted: true, deleted_at: new Date() })
  .where(eq(accounts.id, id));
```

## 4. Row Level Security (RLS)

Enable RLS on every table via migration SQL:

```sql
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own accounts"
  ON accounts FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own accounts"
  ON accounts FOR UPDATE
  USING (owner_id = auth.uid());
```

## 5. Indexes

Add indexes on frequently queried fields:

```typescript
import { index } from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  // ... columns
}, (table) => ({
  ownerIdIdx: index('accounts_owner_id_idx').on(table.owner_id),
  createdAtIdx: index('accounts_created_at_idx').on(table.created_at),
}));
```

## Validation Checklist

- [ ] All tables include required audit fields
- [ ] `owner_id` references `users.id`
- [ ] Soft deletes used (`is_deleted = true`)
- [ ] RLS policies exist for every table
- [ ] Indexes on frequently queried fields
- [ ] Migrations generated and applied
- [ ] `updated_at` trigger exists
