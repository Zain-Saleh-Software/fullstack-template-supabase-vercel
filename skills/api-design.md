# API Design Skill (Vercel + Supabase Stack)

**Description:** Patterns for creating API route handlers, standardized responses, and pagination.
**Role:** The Executor

## 1. Route Structure

All REST endpoints MUST reside in `src/app/api/v1/[resource]/route.ts`.

- `GET` — List resources
- `GET [id]` — Get single resource (`src/app/api/v1/[resource]/[id]/route.ts`)
- `POST` — Create resource
- `PATCH` — Update resource
- `DELETE` — Soft delete resource

## 2. Standard Response Helpers

Use the helpers from `src/lib/api/response.ts`:

```typescript
import { apiError, paginatedResponse } from '@/lib/api/response';
```

### Success Responses

```typescript
// Single item
return new Response(JSON.stringify(item), { status: 200 });

// Created
return new Response(JSON.stringify(newItem), { status: 201 });

// No content
return new Response(null, { status: 204 });
```

### Paginated List

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit')) || 10;
  const offset = Number(searchParams.get('offset')) || 0;

  const items = await db.select().from(accounts)
    .limit(limit).offset(offset);
  const total = await db.select({ count: count() }).from(accounts);

  return paginatedResponse(items, total[0].count, limit, offset);
}
```

### Error Responses

```typescript
return apiError('Account not found', 'NOT_FOUND', 404);
return apiError('Validation failed', 'VALIDATION_ERROR', 400, validationErrors);
return apiError('Unauthorized', 'UNAUTHORIZED', 401);
return apiError('Forbidden', 'FORBIDDEN', 403);
return apiError('Internal server error', 'INTERNAL_ERROR', 500);
```

## 3. Standard API Route Template

```typescript
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/rbac';
import { createAccountSchema } from '@/lib/validators/account';
import { apiError, paginatedResponse } from '@/lib/api/response';
import { logger } from '@/lib/observability/logger';

export async function POST(request: NextRequest) {
  try {
    await requirePermission('account:create');

    const body = await request.json();
    const result = createAccountSchema.safeParse(body);

    if (!result.success) {
      return apiError('Validation failed', 'VALIDATION_ERROR', 400);
    }

    const [account] = await db.insert(accounts)
      .values(result.data)
      .returning();

    logger.info('Account created', { accountId: account.id });
    return new Response(JSON.stringify(account), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Create account error', { error: error.message });
    }
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
```

## 4. Route Conventions

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/accounts` | List (paginated) |
| GET | `/api/v1/accounts/[id]` | Get single |
| POST | `/api/v1/accounts` | Create |
| PATCH | `/api/v1/accounts/[id]` | Update |
| DELETE | `/api/v1/accounts/[id]` | Soft delete |

## Validation Checklist

- [ ] Route in `src/app/api/v1/[resource]/`
- [ ] `requirePermission()` called before data operations
- [ ] Zod validation on request body
- [ ] Standardized responses (`apiError`, `paginatedResponse`)
- [ ] Proper error handling with `catch (error: unknown)`
- [ ] Structured logging with `logger`
- [ ] Tests in `tests/api/[resource].test.ts`
