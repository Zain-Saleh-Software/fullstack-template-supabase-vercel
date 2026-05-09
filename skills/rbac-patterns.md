# RBAC (Role-Based Access Control) Patterns

> **MANDATORY:** ALL rules in `RULES.md` apply. This skill supplements, never overrides, `RULES.md`.
> Every PR, commit, and deployment MUST comply with `RULES.md`. Deviations require an ADR.

## Role Hierarchy
```
admin       → ALL permissions
technician  → user:read, content CRUD, system:read, event:read
member      → content:read/create/update
customer    → content:read only
```

## HARD RULES

### Permissions MUST be database-driven
- The `permissions` database table is the **source of truth**. Hardcoded `ROLE_PERMISSIONS` dicts are FORBIDDEN.
- Permissions MUST be queryable and configurable at runtime via API.
- Every new permission MUST be added to the database permissions table.

### Backend MUST independently enforce
- Frontend permission checks are for UX only (hide buttons, redirect).
- Backend ALWAYS enforces permissions independently via the RBAC dependency system.
- NEVER trust frontend claims about user permissions.

### No hardcoded role checks
- `userRole === 'admin'` or similar inline checks are FORBIDDEN.
- Use `hasPermission(user, permission)` or `require_permission(permission)` only.
- `RoleGuard` and `PermissionGate` components MUST use centralized `hasPermission` function, not inline logic.

## Backend Implementation

### Backend RBAC
```python
from app.core.rbac import rbac, PermissionType, RoleType

# Protect route by permission (PREFERRED — always use permission, not role)
@router.get("/admin")
async def admin_only(current_user = Depends(rbac.require_permission(PermissionType.SYSTEM_ADMIN))):
    ...

# Protect route by role (use only when a whole role category is needed)
@router.get("/technician-panel")
async def tech_panel(current_user = Depends(rbac.require_role(RoleType.TECHNICIAN))):
    ...

# Check permissions programmatically
has_perm = await rbac.user_has_permission(user, PermissionType.USER_CREATE)
perms = await rbac.get_user_permissions(user)
```

### Rule: Always test role collisions
Every role/permission test MUST verify:
1. Admin can access everything
2. Customer cannot access admin features
3. Roles cannot access features outside their permission set
4. Inactive users cannot authenticate

## Frontend Implementation

### Frontend RBAC
```tsx
import { RoleGuard, PermissionGate, UserRoleBadge } from '@/components/rbac'

// Role-based guard (use only when role categorization is needed)
<RoleGuard roles={['admin', 'technician']}>
  <button>Delete User</button>
</RoleGuard>

// Permission-based gate (PREFERRED — always use permission over role)
<PermissionGate permission="content:create">
  <button>Create Post</button>
</PermissionGate>

// Display role
<UserRoleBadge />
```

### Checking permissions in code
```tsx
import { hasPermission } from '@/types/role'

if (hasPermission(user.role, 'user:delete')) {
  // show delete button
}
```

## Rules
1. **Permissions MUST be database-driven** — never hardcoded in source code. Hardcoded role maps are FORBIDDEN.
2. **Admin bypass** — admin always passes all permission/role checks (this is the ONLY hardcoded behavior).
3. **Default role** — new users get "customer" role.
4. **Every new route** that needs protection must add RBAC dependency with a database-backed permission check.
5. **Every new permission** must be added to the `permissions` database table AND the `PermissionType` enum.
6. **Tests MUST verify** — admin has access, customers are denied, each role has correct permissions.
7. **No privilege escalation** — users cannot perform actions outside their role.
8. **Backend enforces** — frontend RBAC is for UX only. The API gate is the real enforcement point.
9. **`hasRole` vs `hasPermission`** — prefer permission-based checks over role-based checks for fine-grained control.
10. **NO inline `=== 'admin'` checks** — always use the RBAC service/functions.
