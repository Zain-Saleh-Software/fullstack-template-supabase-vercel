# RBAC (Role-Based Access Control)

> **Source of Truth:** This skill defines ALL RBAC rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 16.1 Role Hierarchy

```
admin       → ALL permissions (bypass — only hardcoded behavior)
technician  → CRUD for most entities, read-only for sensitive/system
member      → Read + limited create for CRM entities
customer    → Read-only access to most entities
```

### Permission Namespaces

| Namespace | Entities | Permissions |
|-----------|----------|-------------|
| User Management | users | create, read, update, delete |
| Role Management | roles | create, read, update, delete |
| Content | content | create, read, update, delete |
| System | system | read, admin |
| Events | events | read, export |
| Core CRM | accounts, contacts, leads, opportunities, activities, notes, cases, products | create, read, update, delete |
| Extended CRM | campaigns, quotes, orders | create, read, update, delete |
| Junction Tables | opportunity_products, order_items | create, read, delete (no update) |
| HR | departments, positions, employees | create, read, update, delete |
| Knowledge Base | kb_categories, kb_articles | create, read, update, delete |
| TAM | territories, account_territories | create, read, update, delete (no update on junction) |
| AI | action_logs, ai_recommendations | create, read, update (no user-facing create for recommendations) |

---

## 16.2 Permission Model

- Source of truth: `permissions` database table (role_id, action, resource).
- Backend `PermissionType` enum MUST be updated when new permissions are added.
- `ROLE_PERMISSIONS` mapping in code is a cache — DB is the source of truth.
- New user default role: `"customer"`.

---

## 16.3 Backend Enforcement

```python
@router.get("/resource")
async def get_resource(
    current_user = Depends(rbac.require_permission(PermissionType.CONTENT_READ))
): ...
```

- Every new protected route MUST add RBAC dependency.
- **Prefer permission-based** (`require_permission`) over role-based (`require_role`) for fine-grained control.
- NO inline `=== 'admin'` role checks — always use RBAC service/functions.
- `hasRole` checks MUST include admin bypass (admin always passes).

### Backend Implementation
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

---

## 16.4 Frontend Enforcement (UX Only)

- `PermissionGate` component: permission-based gating (PREFERRED).
- `RoleGuard` component: role-based gating (use only when whole role category needed).
- `UserRoleBadge` component: display role badge.
- `hasPermission(user, permission)` utility function from `types/role.ts`.
- Frontend RBAC is for UX only — Backend is the real enforcement point.

### Frontend Implementation
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

---

## 16.4 Additional Authorization Principles

### Deny by Default
- RBAC is built on a deny-by-default model: if no permission record exists for a role+resource+action combination, access is DENIED.
- When adding new resources, explicitly verify that existing roles are NOT automatically granted access to them.
- This applies to ALL layers: API routes, UI components, static files, and background jobs.

### Least Privilege Enforcement
- Every role's permissions MUST be scoped to the minimum required for that role's function.
- **Horizontal least privilege:** Users with the same role should not automatically access each other's resources unless explicitly permitted (requires object-level ownership checks).
- **Vertical least privilege:** Higher roles must explicitly define which lower-role permissions they inherit — no implicit "everything plus more."
- Periodically audit active permissions for "privilege creep."

### IDOR Prevention in RBAC Context
- RBAC alone does NOT prevent IDOR. Even with the correct role, User A must not access User B's resource of the same type.
- **Ownership checks** MUST be implemented independently of role checks:
  - For user-owned resources: verify `resource.owner_id == current_user.id`.
  - For group/team resources: verify `current_user` is a member of the resource's group.
  - Admin bypass: admin can access any resource (this is the only hardcoded override).
- Example pattern:
  ```python
  # Step 1: RBAC check — does user have permission for this action?
  await rbac.require_permission(PermissionType.CONTENT_READ)(current_user)
  # Step 2: Ownership check — does user own this specific resource?
  resource = await content_service.get_by_id(resource_id)
  if resource.owner_id != current_user.id and not current_user.is_admin:
      raise HTTPException(status_code=403, detail="Insufficient privileges")
  ```

### When RBAC is Not Enough (ABAC Consideration)
- Pure RBAC struggles with:
  - **Object-level access control** (User A vs User B resources of same type).
  - **Environment-aware decisions** (time-of-day, location, device type).
  - **Multi-tenant isolation** (Org A vs Org B).
- For these cases, supplement RBAC with **attribute checks** (temporal, environmental, relational) rather than adding more roles.
- Do NOT implement a full ABAC engine until complexity warrants it. Relationship checks + RBAC cover most non-enterprise needs.

### Safe Exit on Authorization Failure
- All RBAC check failures MUST return **403 Forbidden** with a generic message: `{"error": {"code": "FORBIDDEN", "message": "Insufficient privileges"}}`.
- **NEVER** reveal: the required permission name, the user's current permissions, or the specific reason for denial.
- Authorization failures MUST be logged (see observability-patterns.md for `auth_failures_total` metric).

---

## Hard Rules

1. **Permissions MUST be database-driven** — the `permissions` database table is the source of truth. Hardcoded `ROLE_PERMISSIONS` dicts are FORBIDDEN.
2. **Permissions MUST be queryable and configurable at runtime** via API.
3. **Every new permission MUST be added to the database permissions table** AND the `PermissionType` enum.
4. **Backend MUST independently enforce** — frontend permission checks are for UX only (hide buttons, redirect). NEVER trust frontend claims about user permissions.
5. **No hardcoded role checks** — `userRole === 'admin'` or similar inline checks are FORBIDDEN. Use `hasPermission(user, permission)` or `require_permission(permission)` only.
6. **Admin bypass** — admin always passes all permission/role checks (this is the ONLY hardcoded behavior).
7. **Default role** — new users get "customer" role.
8. **Every new route** that needs protection must add RBAC dependency with a database-backed permission check.
9. **Tests MUST verify** — admin has access, customers are denied, each role has correct permissions, inactive users cannot authenticate.
10. **No privilege escalation** — users cannot perform actions outside their role.
11. **Prefer permission-based** checks over role-based checks for fine-grained control.
12. **`RoleGuard` and `PermissionGate`** MUST use centralized `hasPermission` function, not inline logic.
13. **Junction tables** (opportunity_products, order_items, account_territories) use CREATE + READ + DELETE only — no UPDATE permission.
14. **Dashboard metrics** uses `SYSTEM_READ` permission to avoid proliferation of read-only permission types.
15. **Deny by default:** No matching permission rule → access DENIED. Verify when adding new resources.
16. **IDOR prevention:** RBAC alone does not prevent IDOR. Every object access MUST include ownership validation.
17. **Least privilege:** Permissions MUST be minimally scoped per role. Audit periodically.
18. **Safe exit on authz failure:** Return 403 with generic message. NEVER leak permission details.
19. **Log every authz failure** via `auth_failures_total` metric.
20. **Every CRUD operation MUST have its own dedicated permission** — never reuse `READ` permission for `UPDATE`, or `UPDATE` permission for `DELETE`. Each route's `require_permission()` MUST match the actual operation.
21. **All four CRUD permissions (CREATE/READ/UPDATE/DELETE) MUST exist in PermissionType enum** for every entity that supports all four operations. Missing permissions (e.g., `NOTIFICATION_DELETE` or `ATTENDANCE_REPORT_UPDATE`) are bugs.
22. **When a role can receive a resource (e.g., notifications), it MUST also have UPDATE permission** to manage that resource (e.g., mark notifications as read). Check role-permission completeness during code review.
23. **After ANY change to `ROLE_PERMISSIONS` in `rbac.py`, the database MUST be re-seeded** (`python -c "from app.utils.seed import seed_roles_and_permissions; asyncio.run(seed_roles_and_permissions())"`) — the in-memory mapping is only a fallback; the DB `permissions` table is the source of truth.
