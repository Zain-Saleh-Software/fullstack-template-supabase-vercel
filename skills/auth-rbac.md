# Auth & RBAC Skill (Vercel + Supabase Stack)

**Description:** Patterns for Supabase authentication, RBAC engine, permission gates, and middleware.
**Role:** The Architect / The Reviewer

## 1. Supabase Auth Setup

Use `@supabase/ssr` exclusively. No custom JWT or bcrypt.

### Server Client

```typescript
// src/lib/auth/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
}
```

## 2. RBAC Engine

### Permission Format

All permissions use `resource:action` format: `account:create`, `account:read`, `account:update`, `account:delete`.

### Checking Permissions

```typescript
import { requirePermission } from '@/lib/auth/rbac';

// In API routes
await requirePermission('account:create');
await requirePermission('account:read');
```

### Frontend Gate

```tsx
import { PermissionGate } from '@/components/auth/permission-gate';

<PermissionGate permission="account:create">
  <button>Create Account</button>
</PermissionGate>
```

## 3. Middleware

`src/middleware.ts` handles both `next-intl` locale routing and Supabase session refreshing.

```typescript
// Middleware flow:
// 1. Match locales for next-intl
// 2. Refresh Supabase session
// 3. Redirect to login if unauthenticated for protected routes
```

## 4. Superuser Bypass

Superusers (`is_superuser = true`) bypass all permission checks. This is handled automatically by `requirePermission()`.

## 5. RLS + RBAC Together

- RLS provides row-level data isolation (users see only their data)
- RBAC protects API endpoints (users can only call what they're allowed to)
- Both must be configured; they complement each other

## Validation Checklist

- [ ] Supabase Auth used exclusively (no custom JWT/bcrypt)
- [ ] `requirePermission()` called on all protected routes
- [ ] `<PermissionGate>` wraps protected UI elements
- [ ] Middleware handles both locale and auth
- [ ] RLS policies exist alongside RBAC
- [ ] Auth tests cover all permission scenarios
- [ ] No secrets in client-side code
