# Authorization (AuthZ) — OWASP-Compliant

> **Source of Truth:** This skill defines ALL authorization rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).
> **Scope:** Non-enterprise applications (startups, mid-level products). Enterprise models (full ABAC/XACML, ReBAC/Zanzibar) are excluded as premature complexity.

---

## 1. Least Privilege

- **Assign users only the minimum privileges** necessary to perform their function. Apply both horizontally and vertically.
  - Horizontal: An accountant should not access customer data; a sales rep should not access payroll.
  - Vertical: Department heads need more access than their subordinates.

### Design Phase
- Define **trust boundaries** during design.
- Enumerate: user types, resources, operations (CRUD).
- For every user-type/resource combination, determine required permissions.
- Consider environmental attributes where applicable (time of day, network location).

### Ongoing
- **Periodically review permissions** for "privilege creep" — users accumulating more access than needed over time.
- It is easier to **grant** additional permissions than to **revoke** overly broad ones. Plan permissions carefully upfront.

---

## 2. Deny by Default

- **Access MUST be denied unless explicitly granted.** No implicit or neutral position.
- Every request that does not match an explicit allow rule MUST be rejected.
- **Explicit configuration** MUST be preferred over relying on framework/library defaults. Defaults can change with version updates, silently breaking security.
- When adding new endpoints or resources, confirm that the deny-by-default posture applies — assume no access until proven otherwise.

---

## 3. Permissions on Every Request

- **Permissions MUST be validated on EVERY request**, regardless of source (AJAX, server-side, API client, websocket).
- Use **globally applied mechanisms** — NOT per-route/per-method manual checks:
  - Middleware (ASGI/WSGI middleware)
  - Authorization filters/decorators applied globally
  - API gateway-level enforcement
- An attacker only needs to find **one unprotected path**. Even a single missed check can compromise the resource.

---

## 4. IDOR Prevention (Insecure Direct Object Reference)

- **NEVER rely on obfuscation** (hard-to-guess IDs) as the sole protection. Security through obscurity is insufficient.
- **Access control checks MUST be performed for EVERY object request** — just because a user can access one resource of a type does not mean they can access all resources of that type.

### Mitigations
1. **Avoid exposing internal identifiers** when possible. Derive the resource from the authenticated user's identity (e.g., from JWT claims or session).
2. **Use indirect references** (opaque, per-session mappings) instead of direct database keys. See [OWASP ESAPI](https://owasp.org/www-project-enterprise-security-api/).
3. **Validate ownership** — every object lookup MUST verify the requesting user has permission to access THAT SPECIFIC object.
4. **UUIDs are NOT a substitute for access control.** Even with UUIDs, validate permissions.

### Example
```
❌ https://myapp.com/account/901  → No ownership check → IDOR vulnerability
✅ https://myapp.com/account/901  → Check: "Does current user own account 901?"
```

---

## 5. Static Resource Authorization

- **Static resources** (files, images, documents, cloud storage objects) MUST be incorporated into access control policies.
- **Apply the same authorization logic** used for dynamic resources to static resources where they contain sensitive data.
- For cloud storage (S3, GCS, Azure Blob):
  - Use vendor access control tools (bucket policies, IAM, signed URLs).
  - NEVER make sensitive objects publicly accessible.
  - Use pre-signed URLs with expiration for time-limited access.

---

## 6. Server-Side Enforcement (NEVER Trust the Client)

- **Client-side access control is for UX only.** The server MUST be the definitive enforcement point.
- Client-side checks may hide buttons or redirect users, but they MUST NOT be the sole gate.
- An attacker can:
  - Modify JavaScript.
  - Craft raw HTTP requests.
  - Bypass client-side routing.
- **Every API endpoint** MUST independently verify authorization.

---

## 7. Safe Exit on Authorization Failure

- All authorization failures MUST be handled gracefully. **NEVER leave the application in an unstable state.**

### Rules
- **Centralize** authorization failure handling (global exception handler or middleware).
- Return a **generic error** — do not reveal why access was denied (e.g., "Insufficient privileges" is acceptable; "You need role X but have role Y" is NOT).
- **NEVER expose internal details** in error messages (stack traces, debug info, permission names, resource IDs).
- Ensure failures do not leak sensitive data via error messages (see [CWE-209](https://cwe.mitre.org/data/definitions/209.html)).
- HTTP status: **403 Forbidden** for authenticated but unauthorized; **401 Unauthorized** for unauthenticated.

---

## 8. Authorization Failure Logging

- **ALL authorization failures** MUST be logged with consistent, parseable format.
- Log entries MUST include:
  - Timestamp (synchronized clocks).
  - User identifier (or "unauthenticated").
  - Resource/endpoint accessed.
  - Action attempted.
  - Source IP.
  - Request ID (for correlation).
- Logs MUST be monitored for unusual patterns (e.g., rapid 403s indicating probing).
- **NEVER log** the reason for denial in a way that leaks security logic.
- Consider centralized log aggregation for analysis.

---

## 9. Testing Authorization Logic

### Unit Tests
- Test individual authz functions in isolation: permission checks, role resolution, policy evaluation.
- Verify: deny-by-default (no roles → denied), least privilege (no excess permissions), edge cases.

### Integration Tests
- Test every protected endpoint with:
  - Unauthenticated request → **401**
  - Authenticated but unauthorized user → **403**
  - Authorized user → **200/201/204**
  - Admin bypass → **200** (admin always passes)
- Test IDOR: User A tries to access User B's resource → **403**
- Test horizontal privilege escalation attempts.

### What to Cover
| Test Case | Expected Result |
|-----------|:---------------:|
| No auth token | 401 |
| Invalid/expired token | 401 |
| Valid token, no permission | 403 |
| Valid token, has permission | 200/201/204 |
| User A accesses User B's resource | 403 |
| Admin accesses any resource | 200 |
| Deleted/disabled user | 401 |

---

## 10. Third-Party Authorization Components

- **NEVER blindly trust** the default authorization logic of any framework, library, or third-party component.
- Authorization requirements MUST be defined **before** selecting components — not driven by component capabilities.
- **Configure explicitly.** Do not rely on default configurations.
- **Test the configuration** — documentation can be wrong, outdated, or misunderstood.
- Implement **defense in depth**: never depend on a single component for all authorization enforcement.
- Use [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/) to scan for vulnerable components with known authorization bypasses.

---

## 11. Access Control Models

### RBAC (Current Template Default)
- Roles are assigned to users; permissions are associated with roles.
- See `skills/rbac-patterns.md` for the RBAC implementation.
- RBAC works well for simple hierarchies but **struggles with fine-grained object-level control**.

### ABAC (Consider When Needed)
- Attribute-Based Access Control considers subject attributes, object attributes, and environment conditions.
- **Use when:** Access decisions depend on factors beyond role (time of day, location, device, resource ownership, relationship).
- ABAC supports: fine-grained Boolean logic, multi-tenancy, cross-organizational requests.
- Do NOT implement full ABAC until the complexity is warranted; RBAC + relationship checks cover most non-enterprise needs.

### ReBAC (Relationship-Based)
- Grants access based on relationships between resources (e.g., "only the post creator can edit").
- Useful for social/multi-user applications but is added complexity.
- For this template, handle relationship checks via custom permission logic rather than a full ReBAC framework.

---

## Hard Rules

1. **Least privilege:** Users get the minimum permissions needed. Review periodically for privilege creep.
2. **Deny by default:** No explicit allow rule → access DENIED. Never rely on framework defaults.
3. **Permissions on EVERY request:** Globally applied middleware, not per-route manual checks.
4. **IDOR prevention:** Every object access MUST validate ownership. UUIDs are not a substitute for access control.
5. **Static resources** MUST be protected by the same authz logic as dynamic resources.
6. **Server-side enforcement only.** Client-side checks are UX-only — NEVER trust them for security.
7. **Authorization failures** MUST be handled centrally, return 403, and never leak internal details.
8. **Log ALL authorization failures** with consistent format. Monitor for unusual patterns.
9. **Test authz:** 401 for unauthenticated, 403 for unauthorized, 200 for authorized, IDOR attempts blocked.
10. **Third-party authz components** must be explicitly configured and tested. Never rely on defaults.
11. **Apply defense in depth.** Never rely on a single control for authorization.
