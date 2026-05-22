# TypeScript Skill (Vercel + Supabase Stack)

**Description:** TypeScript patterns and best practices for the Next.js + Supabase stack — type guards, generics, Zod inference, dynamic route typing, and avoiding common pitfalls.
**Role:** The Executor / The Reviewer

---

## 1. The `any` Ban

`any` is forbidden in this codebase. Use `unknown` with type guards instead.

### Bad
```typescript
function processData(data: any) { /* ... */ }
catch (error: any) { /* ... */ }
const items = response as any;
```

### Good
```typescript
function processData(data: unknown) {
  if (isValidData(data)) { /* data is now typed */ }
}

catch (error: unknown) {
  if (error instanceof Error) { /* error is Error */ }
}

function isValidData(data: unknown): data is DataType {
  return typeof data === 'object' && data !== null && 'id' in data;
}
```

---

## 2. Type Guards

Use type guards to narrow `unknown` types:

```typescript
// Instance check
if (error instanceof Error) { /* ... */ }

// Type predicate
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj
  );
}

// Discriminated union
type Result =
  | { success: true; data: User }
  | { success: false; error: string };

if (result.success) {
  // result.data is available, result.error is not
  console.log(result.data.email);
} else {
  console.log(result.error);
}

// Zod safeParse
const result = schema.safeParse(input);
if (result.success) {
  // result.data is typed
} else {
  // result.error is ZodError
}
```

---

## 3. Explicit Return Types

Always annotate return types on exported functions:

```typescript
// Good — explicit return type
export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

// Bad — inferred return type (can silently change)
export async function getUserById(id: string) {
  return db.select().from(users).where(eq(users.id, id));
}
```

---

## 4. Next.js Dynamic Route Params

Next.js 15+ requires `params` to be typed as `Promise<>`:

```typescript
// In page.tsx and layout.tsx
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const item = await getItemById(id);
  return <ItemDetail item={item} />;
}
```

In API routes:

```typescript
// src/app/api/v1/items/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

---

## 5. Zod Inference (DRY Types)

Derive TypeScript types from Zod schemas instead of duplicating:

```typescript
// src/lib/validators/item.ts
import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  status: z.enum(['active', 'inactive', 'draft']),
});

// Derive TypeScript type from Zod schema
export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = createItemSchema.partial();
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
```

Now use these types everywhere:

```typescript
import { type CreateItemInput, createItemSchema } from '@/lib/validators/item';

function validateItem(input: unknown): CreateItemInput {
  return createItemSchema.parse(input);
}

// Drizzle insert will infer types from the schema
const [item] = await db.insert(items).values({ ...result.data, ownerId: userId }).returning();
```

---

## 6. Generic Patterns

### Generic API Hook

```typescript
interface UseApiListOptions {
  limit?: number;
  offset?: number;
}

function useApiList<T>(endpoint: string, options?: UseApiListOptions) {
  return useQuery({
    queryKey: [endpoint, options],
    queryFn: async (): Promise<PaginatedResponse<T>> => {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.offset) params.set('offset', String(options.offset));
      const res = await fetch(`${endpoint}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });
}

// Usage
const { data } = useApiList<User>('/api/v1/users');
```

### Generic Repository Pattern

```typescript
async function findById<T>(
  table: PgTable,
  id: string,
  userId: string
): Promise<T | null> {
  const [row] = await db.select()
    .from(table)
    .where(and(
      eq((table as any).id, id),
      eq((table as any).ownerId, userId),
      eq((table as any).isDeleted, false),
    ));
  return (row as T) ?? null;
}
```

---

## 7. Utility Types

```typescript
// Make specific fields required
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Make specific fields optional
type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Non-nullable fields
type NonNullableFields<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

// Extract the data type from a Promise
type AwaitedData<T> = T extends Promise<infer U> ? U : T;
```

---

## 8. `satisfies` Keyword

Use `satisfies` for type-checking without widening:

```typescript
// The config is type-checked against the interface, but keeps literal types
const config = {
  apiVersion: 'v1',
  maxRetries: 3,
  timeout: 5000,
} satisfies AppConfig;

// config.apiVersion is type "v1" (not string)
// config.maxRetries is type 3 (not number)
```

---

## 9. `as const` for Literal Types

```typescript
// Without as const — types are widened
const roles = ['admin', 'manager', 'employee']; // type: string[]

// With as const — exact literal types preserved
const roles = ['admin', 'manager', 'employee'] as const; // type: readonly ["admin", "manager", "employee"]
type Role = (typeof roles)[number]; // "admin" | "manager" | "employee"
```

---

## 10. Discriminated Unions for State

```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function renderState<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'idle': return <div>Ready</div>;
    case 'loading': return <div>Loading...</div>;
    case 'success': return <div>Data: {JSON.stringify(state.data)}</div>;
    case 'error': return <div>Error: {state.error}</div>;
  }
}
```

---

## 11. Strict Config Verification

The template uses strict TypeScript with:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true  // implied by strict
  }
}
```

This means:
- All variables must have explicit or inferred types
- `null` and `undefined` must be handled explicitly
- No implicit `any` anywhere

---

## 12. Common Pitfalls

### Don't Use Enums (Use Union Types)
```typescript
// Bad — TypeScript enums
enum Status { Active, Inactive }

// Good — String union
type Status = 'active' | 'inactive';
```

### Don't Use Namespaces
```typescript
// Bad
namespace Utils { export function foo() {} }

// Good — ES modules
export function foo() {}
```

### Proper Null Checking
```typescript
// Bad — might crash if null
const name = user.name.toUpperCase();

// Good — safe access
const name = user?.name?.toUpperCase() ?? 'Unknown';

// Better — handle explicitly
if (!user) throw new Error('User not found');
const name = user.name.toUpperCase();
```

### Avoid Type Assertions
```typescript
// Bad — overrides type checking
const user = data as User;

// Good — validate at runtime
const result = userSchema.safeParse(data);
if (!result.success) throw new Error('Invalid user data');
const user = result.data;
```

---

## Validation Checklist

- [ ] No `any` types anywhere (use `unknown` with type guards)
- [ ] No `as any` type assertions
- [ ] All exported functions have explicit return types
- [ ] Dynamic route params typed as `Promise<{ ... }>` and awaited
- [ ] Types derived from Zod schemas using `z.infer<>`
- [ ] Union types properly narrowed before use
- [ ] `null`/`undefined` handled explicitly (no unsafe property access)
- [ ] String unions preferred over TypeScript enums
- [ ] Type guards used for `unknown` type narrowing
- [ ] `satisfies` used where type-checking without widening is needed
