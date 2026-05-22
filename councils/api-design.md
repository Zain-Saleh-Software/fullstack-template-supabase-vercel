# API Design Council

**Role:** Guardian of API Consistency, Route Structure, and Response Standardization
**Authority:** Can reject changes with inconsistent routes, missing validation, improper response formats, or absent RBAC checks
**Priority:** #2 (High — API design consistency is critical for frontend consumers)

## Mission

Ensure every API route follows the established patterns: correct location (`src/app/api/v1/`), standardized responses (`apiError`, `paginatedResponse`), Zod validation on all inputs, proper RBAC gating (`requirePermission`), and consistent error handling.

## Focus Areas

### 1. Route Structure

All REST endpoints MUST reside in `src/app/api/v1/[resource]/route.ts`:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/[resource]` | List (paginated) |
| GET | `/api/v1/[resource]/[id]` | Get single |
| POST | `/api/v1/[resource]` | Create |
| PATCH | `/api/v1/[resource]/[id]` | Update |
| DELETE | `/api/v1/[resource]/[id]` | Soft delete |

No custom route patterns. No nested resource routes unless explicitly approved.

### 2. Response Standardization

Every API route MUST use the response helpers from `src/lib/api/responses.ts`:

```typescript
// Success — single item
new Response(JSON.stringify(item), { status: 200 })

// Success — created
new Response(JSON.stringify(item), { status: 201 })

// Success — no content (soft delete)
new Response(null, { status: 204 })

// Success — paginated list
paginatedResponse(items, total, limit, offset)

// Error — all error scenarios
apiError('message', 'ERROR_CODE', statusCode)
apiError('Validation failed', 'VALIDATION_ERROR', 400, validationErrors)
apiError('Not found', 'NOT_FOUND', 404)
apiError('Unauthorized', 'UNAUTHORIZED', 401)
apiError('Forbidden', 'FORBIDDEN', 403)
apiError('Internal server error', 'INTERNAL_ERROR', 500)
```

Never use `NextResponse.json()` directly for errors — use `apiError()`.

### 3. Pagination

All GET list endpoints MUST support pagination:

```typescript
const { limit, offset } = getPaginationParams(new URL(request.url));
// limit: 1-1000, default 100
// offset: 0+, default 0
```

Use `paginatedResponse()` for the response. The response shape:

```json
{
  "data": [...],
  "total": 150,
  "limit": 10,
  "offset": 0
}
```

### 4. Input Validation

All POST/PATCH/PUT routes MUST validate request bodies with Zod schemas:

```typescript
const body = await request.json();
const result = createEntitySchema.safeParse(body);

if (!result.success) {
  return apiError('Validation failed', 'VALIDATION_ERROR', 400, result.error.flatten());
}

// Use result.data (typed and validated)
```

Zod schemas MUST be in `src/lib/validators/[entity].ts` — NEVER inline in route files.

### 5. RBAC Gating

Every protected route MUST call `requirePermission()` before any data operation:

```typescript
// ✅ Correct — permission check first
await requirePermission('invoice:create');
const [invoice] = await db.insert(invoices).values(result.data).returning();

// ❌ Wrong — no permission check
const [invoice] = await db.insert(invoices).values(result.data).returning();
```

Health and auth routes are the only exceptions.

### 6. Error Handling

Every route MUST use proper error handling:

```typescript
try {
  // route logic
} catch (error: unknown) {
  if (error instanceof Error) {
    logger.error('Operation failed', { error: error.message });
  }
  return apiError('Internal server error', 'INTERNAL_ERROR', 500);
}
```

- Never expose `error.message` to the client in production responses
- Never return raw database errors
- Always log errors with structured logger
- Use user-friendly messages in `apiError()` responses

### 7. Database Operations
- All queries MUST use Drizzle ORM
- All queries MUST filter `isDeleted = false` (unless explicitly querying deleted records)
- All queries MUST filter by `ownerId` where applicable
- DELETE routes MUST set `isDeleted = true` (NOT hard delete)
- Return only necessary fields — never return internal database columns

## Review Checklist

### Route Structure
- [ ] Route in `src/app/api/v1/[resource]/route.ts`
- [ ] Correct HTTP method for the operation
- [ ] Dynamic ID route matches `[id]/route.ts` pattern
- [ ] No custom or nested route patterns without approval

### Response Format
- [ ] Uses `apiError()` for all error responses
- [ ] Uses `paginatedResponse()` for all GET list responses
- [ ] Correct status codes (200, 201, 204, 400, 401, 403, 404, 500)
- [ ] Response body is always JSON

### Validation
- [ ] POST/PATCH/PUT routes validate with Zod
- [ ] Zod schemas defined in `src/lib/validators/`
- [ ] Uses `safeParse()` (not `parse()`) for graceful validation
- [ ] Validation errors returned with helpful details

### RBAC
- [ ] `requirePermission()` called before data operations
- [ ] Correct permission string format (`resource:action`)
- [ ] Owner_id set correctly on create operations

### Error Handling
- [ ] All routes wrapped in try-catch
- [ ] Uses `catch (error: unknown)` with narrowing
- [ ] All errors logged with structured logger
- [ ] Error responses use user-friendly messages
- [ ] No stack traces in responses

### Data Operations
- [ ] Drizzle ORM used exclusively
- [ ] `isDeleted = false` filtered on all reads
- [ ] Soft delete pattern on DELETE routes
- [ ] No raw SQL queries

## Rejection Criteria

Reject changes that:
- ❌ API route not in `src/app/api/v1/`
- ❌ Missing `requirePermission()` on protected routes
- ❌ Missing Zod validation on POST/PATCH/PUT
- ❌ Inline Zod schemas in route files (must be in `src/lib/validators/`)
- ❌ Not using `apiError()` for error responses
- ❌ GET list routes without pagination
- ❌ Hard deletes in DELETE routes
- ❌ Exposing internal error details to clients
- ❌ Missing proper error handling (no try-catch)
- ❌ Using `error: any` in catch blocks
- ❌ Raw SQL queries (use Drizzle ORM)

## Escalation

- **Security Council:** RBAC and data access concerns overlap
- **Architect Council:** Route structure and patterns must align with architecture
- **Quality Council:** Error handling and response quality are shared concerns
- **Testing Council:** API routes must have corresponding tests

## Examples

### Good
```typescript
export async function POST(request: NextRequest) {
  try {
    await requirePermission('invoice:create');

    const body = await request.json();
    const result = createInvoiceSchema.safeParse(body);

    if (!result.success) {
      return apiError('Validation failed', 'VALIDATION_ERROR', 400, result.error.flatten());
    }

    const [invoice] = await db.insert(invoices)
      .values({ ...result.data, ownerId: userId })
      .returning();

    logger.info('Invoice created', { invoiceId: invoice.id });
    return new Response(JSON.stringify(invoice), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Create invoice error', { error: error.message });
    }
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
```

### Bad
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Missing: requirePermission, Zod validation, proper error handling
  const invoice = await db.execute(sql`INSERT INTO invoices VALUES (${body.amount})`);
  return NextResponse.json(invoice);
}
```
