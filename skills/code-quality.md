# Code Quality Skill (Vercel + Supabase Stack)

**Description:** Patterns for maintaining clean, readable, maintainable code — naming conventions, file organization, import ordering, JSDoc documentation, DRY enforcement, and size limits.
**Role:** The Executor / The Reviewer

---

## 1. Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `user-profile.tsx`, `api-design.md` |
| Components | PascalCase | `UserProfile`, `DeleteButton` |
| Functions | camelCase | `getUserById`, `handleSubmit` |
| Variables | camelCase | `userName`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_LIMIT` |
| Types/Interfaces | PascalCase | `UserProfile`, `ApiResponse<T>` |
| Database columns | snake_case | `created_at`, `owner_id` |
| API routes | kebab-case directories | `api/v1/user-profiles/` |
| Booleans | `is*` / `has*` prefix | `isLoading`, `isActive`, `hasPermission` |
| Event handlers | `handle*` prefix | `handleSubmit`, `handleDelete` |

---

## 2. File Organization

### Maximum File Size: 300 lines

If a file exceeds 300 lines, split it:
- Extract helper functions to a separate file
- Break large components into sub-components
- Split large type definitions into a types file
- Move utility functions to `lib/utils/`

### Maximum Function Size: 50 lines

If a function exceeds 50 lines:
- Extract sub-logic into helper functions
- Split into smaller, composable functions
- Move complex data transformation to a dedicated module

### Directory Structure

Each feature/module follows this pattern:

```
src/app/[locale]/dashboard/invoices/
├── page.tsx                 # List page
├── new/page.tsx             # Create page
├── [id]/page.tsx            # Detail page
├── [id]/edit/page.tsx       # Edit page
├── actions.ts               # Server actions (if used)
└── _components/             # Feature-specific components (underscore = private)
    ├── invoice-table.tsx
    ├── invoice-form.tsx
    └── invoice-status-badge.tsx
```

---

## 3. Import Organization

Imports MUST follow this order, with a blank line between groups:

```typescript
// 1. Next.js
import { NextRequest } from 'next/server';
import { notFound } from 'next/navigation';

// 2. React
import { useState, useEffect, useCallback } from 'react';

// 3. Third-party libraries
import { eq, and, desc, count } from 'drizzle-orm';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';

// 4. Internal modules (absolute paths with @/ alias)
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/rbac';
import { createAccountSchema } from '@/lib/validators/account';
import { apiError, paginatedResponse } from '@/lib/api/responses';
import { logger } from '@/lib/observability/logger';

// 5. Relative imports (same directory)
import { Button } from './button';
import { formatCurrency } from './utils';
```

Use `@/` alias for all internal imports outside the current directory. Never use deep relative paths like `../../lib/db`.

---

## 4. JSDoc Documentation

### When to Use JSDoc
- All exported functions
- All exported types/interfaces
- Complex business logic
- Non-obvious design decisions

```typescript
/**
 * Creates a new account with the given data, performs permission checks,
 * and logs the operation for audit purposes.
 *
 * @param request — The HTTP request containing the account data in JSON body
 * @returns A Response with the created account (status 201) or an error
 *
 * @throws Will return 403 if the user lacks the `account:create` permission
 * @throws Will return 400 if the request body fails Zod validation
 * @throws Will return 500 on unexpected database errors
 *
 * @example
 * POST /api/v1/accounts
 * Body: { "name": "Acme Corp", "accountType": "customer" }
 * Response: { "id": "...", "name": "Acme Corp", ... }
 */
export async function POST(request: NextRequest) { /* ... */ }
```

### When NOT to Use JSDoc
- Private helper functions (unless complex)
- Obvious getters/setters
- React component props (use interface comments instead)

---

## 5. Comments

### Good Comments (Explain WHY)
```typescript
// We use the transaction pooler (port 6543) because Vercel serverless
// functions exhaust direct connections. The pooler manages connection reuse.
const dbUrl = process.env.DATABASE_URL; // Must point to pooler in production

// Superusers bypass all permission checks — this is intentional
// to allow system administrators to perform any operation.
if (user.isSuperuser) return true;
```

### Bad Comments (Explain WHAT — the code already shows this)
```typescript
// Get the user by ID
const user = await getUserById(id);

// Return 403
return apiError('Forbidden', 'FORBIDDEN', 403);

// Increment i by 1
i = i + 1;
```

### No Comments Needed
```typescript
// Clean code is self-documenting
const maxRetryCount = 3;
if (attemptCount > maxRetryCount) throw new Error('Max retries exceeded');

// Better than:
// If attempts exceed 3, stop trying
// const x = 3;
// if (a > x) { throw error }
```

---

## 6. DRY (Don't Repeat Yourself)

### Extract Repeated Patterns

```typescript
// Bad — repeated owner_id + is_deleted filtering
const userAccounts = await db.select().from(accounts)
  .where(and(eq(accounts.ownerId, userId), eq(accounts.isDeleted, false)));
const userContacts = await db.select().from(contacts)
  .where(and(eq(contacts.ownerId, userId), eq(contacts.isDeleted, false)));

// Good — extracted helper
function ownerScope(table: PgTable, userId: string) {
  return and(
    eq((table as any).ownerId, userId),
    eq((table as any).isDeleted, false),
  );
}
const userAccounts = await db.select().from(accounts).where(ownerScope(accounts, userId));
const userContacts = await db.select().from(contacts).where(ownerScope(contacts, userId));
```

### But Don't Over-DRY

```typescript
// Bad — premature abstraction that's harder to read
const createHandler = (resource: string, schema: ZodSchema) => async (req: NextRequest) => {
  // 50 lines of generic handler logic
};

// Good — straightforward, readable
export async function POST(request: NextRequest) {
  // 15 lines specific to this route
}
```

**Rule of three:** Extract only after the THIRD repetition.

---

## 7. Magic Numbers

Replace magic numbers with named constants:

```typescript
// Bad
if (response.status === 429) { /* ... */ }
setTimeout(() => refetch(), 5000);
const pageSize = 20;

// Good
const RATE_LIMIT_STATUS = 429;
const REFETCH_INTERVAL_MS = 5000;
const DEFAULT_PAGE_SIZE = 20;
```

---

## 8. Nesting Depth

Maximum 3 levels of nesting. Flatten with early returns:

```typescript
// Bad — 5 levels deep
function process(data) {
  if (data) {
    if (data.items) {
      data.items.forEach((item) => {
        if (item.isActive) {
          if (item.price > 0) {
            // do something
          }
        }
      });
    }
  }
}

// Good — early returns flatten the logic
function process(data: Data | null): Result[] {
  if (!data?.items) return [];

  return data.items
    .filter((item) => item.isActive)
    .filter((item) => item.price > 0)
    .map((item) => ({ /* ... */ }));
}
```

---

## 9. Boolean Expressions

```typescript
// Bad — double negative, hard to parse
if (!isNotReady) { /* ... */ }

// Good — positive, readable
if (isReady) { /* ... */ }

// Bad — complex inline condition
if (user && user.role && user.role.permissions && user.role.permissions.includes('admin') && !user.isDeleted && user.isActive) { /* ... */ }

// Good — extracted with meaningful name
const canAccessAdmin = user?.role?.permissions?.includes('admin') ?? false;
const isActiveUser = user && !user.isDeleted && user.isActive;
if (canAccessAdmin && isActiveUser) { /* ... */ }
```

---

## 10. One Component Per File

Each file contains ONE component and its sub-components (if small and related).

```typescript
// user-profile.tsx — good: main component + small related sub-components
export function UserProfile({ user }: { user: User }) { /* ... */ }
function Avatar({ url }: { url: string }) { /* ... */ }
function UserName({ name }: { name: string }) { /* ... */ }

// If sub-components grow, extract to separate files:
// user-profile.tsx
// user-avatar.tsx
// user-name.tsx
```

---

## 11. Error-Prone Patterns to Avoid

```typescript
// ❌ Multiple await in sequence (use Promise.all when independent)
const user = await getUser(id);
const items = await getItems(id);
// ✅
const [user, items] = await Promise.all([getUser(id), getItems(id)]);

// ❌ Using index as key
{items.map((item, i) => <div key={i}>{item.name}</div>)}
// ✅
{items.map((item) => <div key={item.id}>{item.name}</div>)}

// ❌ String concatenation for URLs
const url = '/api/v1/items/' + id + '/details';
// ✅
const url = `/api/v1/items/${id}/details`;

// ❌ Complicated ternary
const status = score > 90 ? 'excellent' : score > 70 ? 'good' : score > 50 ? 'average' : 'poor';
// ✅
function getStatus(score: number): string {
  if (score > 90) return 'excellent';
  if (score > 70) return 'good';
  if (score > 50) return 'average';
  return 'poor';
}
```

---

## Validation Checklist

- [ ] Files under 300 lines; functions under 50 lines
- [ ] kebab-case file names, PascalCase components, camelCase functions
- [ ] Imports organized: Next.js → React → Third-party → Internal → Relative
- [ ] `@/` alias used for all internal imports
- [ ] JSDoc on all exported functions and types
- [ ] Comments explain WHY, not WHAT
- [ ] DRY: repeated patterns extracted (after 3rd repetition)
- [ ] No magic numbers — use named constants
- [ ] Maximum 3 levels of nesting
- [ ] Boolean variables use positive naming (`isReady`, not `isNotReady`)
- [ ] One component per file (with small related sub-components OK)
- [ ] No index as React key
- [ ] Independent promises use `Promise.all`
- [ ] No string concatenation for URLs (use template literals)
