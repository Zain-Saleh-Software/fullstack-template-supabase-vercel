# Error Handling Skill (Vercel + Supabase Stack)

**Description:** Patterns for proper error handling across the full stack — API routes, Server Components, Client Components, error boundaries, Sentry integration, and user-friendly error messages.
**Role:** The Executor / The Reviewer

---

## 1. API Route Error Handling

### Standard Pattern

Every API route MUST use this pattern:

```typescript
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { apiError } from '@/lib/api/responses';
import { logger } from '@/lib/observability/logger';

export async function POST(request: NextRequest) {
  try {
    await requirePermission('entity:create');

    const body = await request.json();
    const result = createSchema.safeParse(body);

    if (!result.success) {
      return apiError('Validation failed', 'VALIDATION_ERROR', 400, result.error.flatten());
    }

    const [entity] = await db.insert(table).values(result.data).returning();

    if (!entity) {
      return apiError('Failed to create resource', 'CREATE_FAILED', 500);
    }

    logger.info('Entity created', { entityId: entity.id });
    return new Response(JSON.stringify(entity), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Create entity error', { error: error.message, stack: error.stack });

      if (error.message.includes('Forbidden')) {
        return apiError('Forbidden', 'FORBIDDEN', 403);
      }
    }
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
```

### Error Status Codes

| Code | When |
|------|------|
| 400 | Validation errors, bad request format |
| 401 | Missing or invalid authentication |
| 403 | Authenticated but no permission |
| 404 | Resource not found |
| 409 | Conflict (duplicate, state violation) |
| 422 | Unprocessable entity (valid format, invalid business logic) |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

### Error Response Shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fieldErrors": {
        "name": ["Required"],
        "email": ["Invalid email format"]
      }
    }
  }
}
```

Never expose `error.message`, `error.stack`, or internal database errors to clients in production.

---

## 2. The `catch (error: unknown)` Rule

`catch (error: any)` is FORBIDDEN. Always use:

```typescript
catch (error: unknown) {
  if (error instanceof Error) {
    // error is now typed as Error
    logger.error('Something failed', { error: error.message });
  } else {
    // error is some other thrown value (string, number, etc.)
    logger.error('Something failed', { error: String(error) });
  }
}
```

### Type Narrowing for Specific Errors

```typescript
catch (error: unknown) {
  if (error instanceof ZodError) {
    return apiError('Validation failed', 'VALIDATION_ERROR', 400, error.flatten());
  }

  if (error instanceof Error) {
    if (error.message.includes('Forbidden')) {
      return apiError('Forbidden', 'FORBIDDEN', 403);
    }
    if (error.message.includes('duplicate key')) {
      return apiError('Resource already exists', 'CONFLICT', 409);
    }
    logger.error('Unexpected error', { error: error.message });
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }

  logger.error('Unknown error type', { error: String(error) });
  return apiError('Internal server error', 'INTERNAL_ERROR', 500);
}
```

---

## 3. Error Boundaries (error.tsx)

Every layout segment under `src/app/[locale]/` MUST have a co-located `error.tsx`:

```tsx
// src/app/[locale]/error.tsx
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useTranslations } from 'next-intl';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations('errors');

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">{t('somethingWentWrong')}</h2>
      <p className="text-gray-600 dark:text-gray-400">{t('tryAgainMessage')}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {t('tryAgain')}
      </button>
    </div>
  );
}
```

### Where to Place Error Boundaries

```
src/app/[locale]/error.tsx                         ← Root error boundary
src/app/[locale]/(authenticated)/error.tsx         ← Authenticated area
src/app/[locale]/(authenticated)/dashboard/error.tsx ← Dashboard specific
```

Error boundaries catch errors in child layouts, pages, and loading states.

---

## 4. Server Component Error Handling

Server Components cannot use try-catch for rendering errors. Use error boundaries instead:

```typescript
// Server Component — data fetch with error handling
export default async function DashboardPage() {
  try {
    const data = await db.select().from(items).where(eq(items.ownerId, userId));
    return <DashboardContent items={data} />;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Dashboard fetch failed', { error: error.message });
    }
    // This will trigger the nearest error.tsx
    throw new Error('Failed to load dashboard data');
  }
}
```

Alternatively, handle errors gracefully with fallback UI:

```typescript
export default async function DashboardPage() {
  try {
    const data = await db.select().from(items);
    return <DashboardContent items={data} />;
  } catch (error: unknown) {
    logger.error('Dashboard fetch failed', { error });
    return <DashboardErrorFallback />;
  }
}
```

---

## 5. Client Component Error Handling

### React Query Error Handling

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['items'],
  queryFn: () => fetch('/api/v1/items').then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }),
  retry: 2,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
});

if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorDisplay message={error.message} />;
```

### Form Mutation Error Handling

```typescript
const mutation = useMutation({
  mutationFn: (data) => fetch('/api/v1/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async (r) => {
    const body = await r.json();
    if (!r.ok) throw new Error(body.error?.message || 'Unknown error');
    return body;
  }),
  onError: (error) => {
    logger.error('Mutation failed', { error: error.message });
  },
});
```

---

## 6. Error Logging (Structured Logger + Sentry)

### Logging Errors

```typescript
import { logger } from '@/lib/observability/logger';
import * as Sentry from '@sentry/nextjs';

// Standard error logging
logger.error('Operation failed', { error: error.message, userId, resourceId });

// Critical errors: log + Sentry
Sentry.captureException(error, {
  extra: { userId, resourceId },
  tags: { area: 'api', operation: 'create' },
});

// Non-error events
logger.warn('Rate limit approaching', { current: 95, limit: 100, userId });
logger.info('Item created', { itemId: newItem.id, userId });
```

### What NOT to Log
- Passwords, tokens, or secrets
- Full user objects (log only IDs)
- Raw request bodies (may contain sensitive data)
- Personally identifiable information (PII)

---

## 7. Loading States

Every async operation needs a loading state:

```tsx
// Server Component — loading.tsx (co-located)
export default function Loading() {
  return <div className="animate-pulse">Loading...</div>;
}

// Client Component — manual loading state
if (isLoading) {
  return <Skeleton count={5} />;
}
```

---

## 8. Empty States

Lists without data need empty states:

```tsx
if (!data || data.length === 0) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">{t('noItems')}</p>
      <PermissionGate permission="item:create">
        <Button href="/items/new">{t('createFirst')}</Button>
      </PermissionGate>
    </div>
  );
}
```

---

## 9. User-Facing Error Messages

### Good (User-Friendly)
- "Something went wrong. Please try again."
- "The email address is already registered."
- "You don't have permission to access this page."
- "Please fill in all required fields."

### Bad (Too Technical / Security Risk)
- "DatabaseError: relation 'accounts' does not exist"
- "TypeError: Cannot read property 'id' of null"
- "PostgresError: duplicate key value violates unique constraint"
- Stack traces of any kind

---

## Validation Checklist

- [ ] Every API route wrapped in try-catch
- [ ] All catch blocks use `catch (error: unknown)`
- [ ] Error messages are user-friendly, not technical
- [ ] No stack traces in API responses
- [ ] Error boundaries on every layout segment
- [ ] Loading states for all async operations
- [ ] Empty states for lists with no data
- [ ] All errors logged with structured logger
- [ ] Sentry captures critical exceptions
- [ ] No sensitive data in log messages
- [ ] Proper status codes for different error types
- [ ] Zod validation errors returned with helpful details
