# AI Project Initialization — Complete Migration Workflow

> **Source of Truth:** This skill defines the EXACT step-by-step workflow for migrating this template to a production-ready project.
> **Compliance:** Mandatory for every project migration. Every step MUST be followed in order.
> **IMMUTABLE:** This file and ALL skill files in `skills/` MUST NEVER be modified, deleted, or renamed.

---

## Core Principles

### Pattern, Not Content
This template's POC content (accounts, contacts, leads, CRM entities, CRM pages) exists ONLY to demonstrate architectural patterns. The content MUST be replaced. The PATTERNS (ORM, auth, RBAC, observability, frontend architecture, deployment) are production-ready and MUST be retained.

### What Is IMMUTABLE (Keep As-Is)

**Backend Systems (fully immutable):**
- **Auth system:** JWT, bcrypt, password reset, MFA-ready, rate limiting
- **RBAC engine:** DB-backed permissions, PermissionType enum, RoleGuard, PermissionGate
- **ORM layer:** BaseORM, PostgresORM, SupabaseORM, QueryBuilder, MockORM
- **Middleware stack:** All 7 middleware components
- **Observability:** structlog logging, OpenTelemetry tracing, Prometheus metrics
- **API infrastructure:** API client, auth API, interceptors, refresh logic
- **Testing infrastructure:** conftest.py, MockORM, factories
- **All files in `skills/`, `CLAUDE.md`, `RULES.md`, `scripts/validate-rules.sh`**

**Frontend Systems — Pattern vs. Look & Feel:**

The following frontend components have their **functionality patterns** (validation, error handling, accessibility, state management, composition) defined by the template. Their **visual appearance** (colors, sizing, spacing, borders, shadows, typography, layout distribution, branding) is **fully user-controllable**.

| Component | Pattern to Follow (immutable) | Look & Feel (user controls) |
|-----------|------------------------------|----------------------------|
| **Button** | `forwardRef`, `memo`, variants (primary/secondary/danger/ghost), sizes (sm/md/lg), loading state with spinner + `aria-busy`, disabled state with `cursor-not-allowed`, focus ring, `aria-label` for icon-only | Tailwind classes for colors, backgrounds, border radius, padding, font size, hover/active transitions |
| **Input** | `forwardRef`, `memo`, `label` with `htmlFor`, `error` prop display with `role="alert"`, `aria-invalid`, `aria-describedby`, `helperText` | Tailwind classes for border colors, background on error, text colors, sizing, rounding |
| **Skeleton** | `animate-pulse` pattern, `role="status"`, `aria-label="Loading..."`, SkeletonTable grid, SkeletonCard shape | Dimensions via `className`, border radius, background color |
| **Toast** | Fixed-position container, auto-dismiss timer, stack management, success/error/info variants | Position (top-right default), colors, animations, max width |
| **Pagination** | Page number display, prev/next buttons, `limit`/`offset` query params, disabled states for bounds | Colors, sizing, spacing, button styles |
| **ProtectedRoute** | `useAuth()` check, loading → Skeleton, not-authenticated → redirect `/login?return=`, authenticated → render children/Outlet | Visual loading indicator appearance |
| **LayoutWrapper** | `flex-col min-h-screen`, `<main>` with `max-w-7xl mx-auto`, wraps with `LocaleProvider` | Colors, background, spacing, max-width value, padding |
| **Header** | `memo`, theme toggle, locale toggle (en/ar), logo/home link, dashboard link (if auth), login/logout buttons, user display name, nav links | Logo styling, colors, height, link styles, dropdown styling, mobile menu behavior |
| **Footer** | `memo`, copyright, privacy link, terms link | Colors, height, link styling, additional links |
| **UserRoleBadge** | Colored badge by role (admin=purple, technician=blue, member=green, customer=gray) | Color mapping per role, badge shape/size |
| **ThemeToggle** | `memo`, sun/moon inline SVG icons (sun in dark, moon in light), calls `toggleTheme()`, `aria-label` for accessibility | Colors, sizing, border radius |
| **ThemeContext** | State: `theme` ('light'|'dark'|'system'), resolves system preference via `prefers-color-scheme`, persists to localStorage, toggles `dark` class on `<html>` | N/A (functional pattern only) |

**Auth Context (`AuthContext`):** Fully immutable — session management, token storage, `login`/`register`/`logout` actions, `useAuth()` hook contract.

**Theme Context (`ThemeContext`):** Fully immutable — theme state (`'light'|'dark'|'system'`), resolves system preference via `prefers-color-scheme`, persists to localStorage, toggles `dark` class on `<html>`, `useTheme()` hook contract. `ThemeProvider` wraps `LocaleProvider` in the provider hierarchy.

**Locale Context (`LocaleContext`):** Fully immutable — `t()` function, locale switching, RTL support, bilingual JSON loading.

**Types (index.ts, api.ts, user.ts, role.ts):** Fully immutable — `PaginatedResponse`, `ApiError`, `Theme`, `User`, `RoleType`, `PermissionType`, `hasPermission()`, `hasRole()`.

### User UI Instructions Are ABSOLUTE

When the user provides UI/frontend specifications — whether HTML, CSS, component designs, layout descriptions, color schemes, spacing rules, or any visual instruction — you MUST follow them exactly.

- **User says how it should look → that is final.** The "Look & Feel" column in the table above exists to give you freedom, but if the user overrides any of those defaults with specific instructions, the user's instructions win.
- **Exact fidelity:** If the user provides HTML samples, CSS snippets, design references, or describes a specific layout, replicate it faithfully. Do not invent your own interpretation.
- **No unnecessary divergence:** If the user says "make the header dark blue with a left-aligned logo", do exactly that. Do not add extra styling or change colors unless asked.
- **Preserve functionality patterns:** While following the user's visual instructions, still preserve the template's functionality patterns — validation, error handling, accessibility attributes, component composition, state management.

### Responsiveness Is MANDATORY — 100% Coverage

Every single page, component, and layout MUST be fully responsive across ALL device sizes and ALL languages.

| Requirement | Detail |
|-------------|--------|
| **Mobile** (320px+) | Stacked layouts, touch-friendly targets (min 44px), hamburger menus, readable font sizes |
| **Tablet** (768px+) | Hybrid layouts, sidebars collapse, tables horizontal scroll or card transform |
| **Desktop** (1024px+) | Full multi-column layouts, sidebars visible, max-width constrained |
| **Large screens** (1440px+) | Max-width containers, whitespace balance, don't stretch infinitely |
| **RTL (Arabic)** | Mirror the responsive breakpoints — test every layout at every breakpoint with `dir="rtl"` |
| **LTR (English)** | Standard responsive patterns with logical CSS properties (`margin-inline-start` not `margin-left`) |

**Responsive rules enforced:**
- Use Tailwind responsive prefixes exclusively (`sm:`, `md:`, `lg:`, `xl:`) — never fixed widths
- Tables MUST become cards on mobile (hide columns, stack vertically)
- Forms MUST be single-column on mobile, multi-column on desktop
- Navigation MUST collapse to hamburger on mobile
- Modals/dialogs MUST be full-screen on mobile, centered overlay on desktop
- Font sizes MUST scale down on mobile (use `text-sm md:text-base` pattern)
- Touch targets MUST be at least 44×44px on mobile (buttons, links, inputs)
- Always test responsive behavior in BOTH `ltr` and `rtl` directions
- Use `flex-wrap`, `grid-cols-{1|2|3|...}`, `gap-*` for fluid layouts — never hardcode widths

**Violation:** A page that looks broken on any screen size or any language direction is a FAILURE. The project MUST NOT ship until responsiveness is verified at 320px, 768px, 1024px, and 1440px in both LTR and RTL.

### Component Organization

Every page and component MUST be well organized:
- **Logical grouping:** Related fields and actions are grouped together visually (cards, sections, fieldsets)
- **Consistent spacing:** Uniform gaps, paddings, and margins throughout the app
- **Clear hierarchy:** Headings, subheadings, body text have distinct visual weight
- **Whitespace:** Generous but not excessive — content should breathe without wasting space
- **Alignment:** Labels, inputs, buttons, and icons are consistently aligned

### What MUST Be Replaced (POC Content)
- **Database tables:** accounts, contacts, leads, opportunities, activities, notes, cases, products, territories, campaigns, quotes, orders, opportunity_products, order_items, account_territories, kb_categories, kb_articles, departments, positions, employees, action_log, ai_recommendations
- **Backend models:** account.py, contact.py, lead.py, opportunity.py, activity.py, notes.py, cases.py, products.py
- **Backend schemas:** account.py, contact.py, lead.py, opportunity.py, activity.py, notes.py, cases.py, products.py
- **Backend services:** account_service.py, contact_service.py, lead_service.py, opportunity_service.py, activity_service.py, notes_service.py, cases_service.py, products_service.py
- **Backend routes:** accounts.py, contacts.py, leads.py, opportunities.py, activities.py, notes.py, cases.py, products.py
- **Frontend pages:** pages/accounts/, pages/contacts/, pages/Home.tsx, pages/Dashboard.tsx
- **Frontend types:** types/account.ts, types/contact.ts
- **Frontend API:** api/accounts.ts, api/contacts.ts
- **Frontend hooks:** useAccountsQuery.ts, useContactsQuery.ts
- **i18n keys:** All CRM-specific translation keys
- **RBAC permissions:** CRM-specific permission names (replace with your domain)
- **Seed data:** CRM demo data in utils/seed.py
- **README:** Entirely overwrite with new project details
- **Deployment names:** Docker images, container names, service names, Vercel project

---

## Phase 0: Requirements Analysis & Domain Modeling

**Before writing any code, fully analyze the user's request.**

### Step 0.1: Extract Project Identity
```
Project Name:        [e.g., "InventoryPro", "TaskFlow", "OrderHive"]
Project Slug:        [kebab-case: "inventory-pro", "taskflow", "order-hive"]
Project Description: [1-2 sentence description]
Database Name:       [snake_case: "inventory_pro", "taskflow", "order_hive"]
Docker Image Prefix: [e.g., "inventorypro", "taskflow", "orderhive"]
```

### Step 0.2: Define Entities
For each entity the project needs, document:
```
Entity Name:     [e.g., "Product", "Order", "Task", "Customer"]
Table Name:      [snake_case, plural: "products", "orders", "tasks"]
Fields:          [field name, type, constraints, FK relationships]
Key Operations:  [CRUD, search, filter, aggregate, export]
RBAC Permissions: [what roles can do what with this entity]
Frontend Pages:  [List, Detail, Form, or Junction list+form]
Golden Question: [Would business care about this record in a year? → events table]
```

### Step 0.3: Define Roles & Permissions
```
Role Name    | Slug       | Permissions
-------------|------------|----------------------------------------------
Admin        | admin      | ALL (bypass — hardcoded)
Manager      | manager    | [entity]:create, read, update, delete for core
Editor       | editor     | [entity]:create, read, update
Viewer       | viewer     | [entity]:read
```

### Step 0.4: Plan Frontend Pages
For each entity, plan:
```
- List page:    table with columns, search, pagination, delete, create button
- Detail page:  metadata display, edit/delete actions
- Form page:    create/edit form with validation
- (Junction:    list + create form only, no detail/edit)
```

### Step 0.5: Verify Against Skill Files
Before proceeding, read:
- `skills/mvp-architecture.md` — understand layered architecture
- `skills/orm-patterns.md` — understand DB schema requirements
- `skills/crm-database-patterns.md` — use as REFERENCE for table design patterns (not content)

---

## Phase 1: Project Renaming & Metadata

**Goal: Eliminate ALL references to the template name. No "fullstack-template", "fullstack", "crm", "skeleton" remains.**

### Step 1.1: Update Root Metadata Files

| File | What to Change | Example |
|------|---------------|---------|
| `README.md` | Entirely overwrite with new project name, description, setup, architecture | Replace all content |
| `pyproject.toml` | `name`, `description`, `authors`, `version` | `name = "inventory-pro"` |
| `frontend/package.json` | `name`, `description`, `author`, `homepage` | `"name": "inventory-pro-frontend"` |
| `Makefile` | Update help text branding (line 35) | Replace "Fullstack Template" with project name |

### Step 1.2: Update Deployment & Docker Files

| File | What to Change |
|------|---------------|
| `docker-compose.yml` | `services.backend.container_name`, `services.frontend.container_name`, `image:` tags, `project` labels |
| `docker-compose.dev.yml` | Container names if overridden |
| `docker-compose.override.yml` | Container names if overridden |
| `deploy/docker-compose.prod.yml` | Container names, image names, service names |
| `deploy/render.yaml` | Service names from `fullstack-backend`/`fullstack-frontend` to `{project}-backend`/`{project}-frontend` |
| `frontend/vercel.json` | Update if name/repo references exist |
| `deploy/aws/ecs-task-definition.json` | Container names, family, task role names |
| `deploy/nginx.conf` | Update any hardcoded references |
| `frontend/nginx/default.conf` | Update any hardcoded references |

### Step 1.3: Update Environment & Config Files

| File | What to Change |
|------|---------------|
| `.env.example` | Update `APP_NAME`, `VITE_API_BASE_URL` defaults, comments |
| `backend/.env.example` (if exists) | Update references |
| `frontend/.env.example` (if exists) | Update `VITE_API_BASE_URL` |

### Step 1.4: Update CI/CD & GitHub Files

| File | What to Change |
|------|---------------|
| `.github/workflows/*.yml` | Update image tags `fullstack-backend` → `{project}-backend`, `fullstack-frontend` → `{project}-frontend`, update job names |
| `.github/dependabot.yml` | Update any project references |
| `.githooks/pre-push` | Update any hardcoded project names |

### Step 1.5: Update Documentation & Code References

| File | What to Change |
|------|---------------|
| `scripts/validate-rules.sh` | Any `fullstack` references if they exist |
| `frontend/src/utils/constants.ts` | `APP_NAME`, `COMPANY_NAME` — set to project values |
| `frontend/index.html` | `<title>` tag, meta description |
| `frontend/public/favicon.ico` | Replace with project favicon |
| `frontend/src/components/Layout/Header.tsx` | Logo text/link — replace template branding with project name |

### Step 1.6: Verify No Template Names Remain
```bash
grep -ri "fullstack-template\|fullstack template\|crm template\|skeleton" --include="*.md" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.toml" --include="*.yml" --include="*.yaml" --include="*.cfg" --include="*.ini" --include="*.env*" --include="*.conf" --include="*.sh" --include="Dockerfile*" .
# If any match found, rename it to the new project name
```

---

## Phase 2: Database Schema Design & Migration

**Goal: Create the project's database schema. Remove ALL POC CRM tables and triggers. Create your domain tables following template patterns.**

### Step 2.1: Create Initial Migration (`backend/migrations/001_initial.sql`)

This migration replaces `001_initial.sql`. It MUST include:

#### 2.1.1. ENUM Types
Define ENUMs for your domain:
```sql
CREATE TYPE product_status AS ENUM ('active', 'draft', 'archived', 'discontinued');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
-- etc.
```

#### 2.1.2. Core System Tables (MUST exist, kept from template)
```sql
-- users, roles, permissions, events, table_changes, user_tokens, password_resets
-- These are structural — use the exact schema from the template's original 001_initial.sql
-- Do NOT change these table schemas — they are part of the immutable auth/RBAC/observability core
```

#### 2.1.3. Your Business Tables
For EACH entity defined in Phase 0 Step 2, add:
```sql
CREATE TABLE {entity_plural} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Your entity-specific columns
    {field1} {type} {constraints},
    {field2} {type} {constraints},
    -- Audit fields (REQUIRED)
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_{entity_plural}_owner ON {entity_plural}(owner_id);
CREATE INDEX idx_{entity_plural}_created ON {entity_plural}(created_at);
-- Add more indexes for WHERE/JOIN/ORDER BY columns

-- RLS
ALTER TABLE {entity_plural} ENABLE ROW LEVEL SECURITY;

-- Auto-update trigger
CREATE TRIGGER set_updated_at_{entity_plural}
    BEFORE UPDATE ON {entity_plural}
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Change tracking trigger (STATEMENT-level)
CREATE TRIGGER notify_{entity_plural}_change
    AFTER INSERT OR UPDATE OR DELETE ON {entity_plural}
    FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
```

#### 2.1.4. Junction Tables (if needed)
For M:N relationships:
```sql
CREATE TABLE {entity_a}_{entity_b} (
    {entity_a}_id UUID REFERENCES {entity_a}(id) ON DELETE CASCADE,
    {entity_b}_id UUID REFERENCES {entity_b}(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY ({entity_a}_id, {entity_b}_id)
);
-- Junction tables: NO soft delete, NO update, NO detail page
```

### Step 2.2: Register Columns in PostgresORM

Edit `backend/app/orm/postgres_orm.py`:
- Add your new tables to `VALID_COLUMNS` dict
- Each table needs its column names listed for validation
- Example: `"{entity_plural}": {"id", "name", "owner_id", "created_at", "updated_at", "is_deleted", "deleted_at", ...}`

### Step 2.3: Run Migration
```bash
make db-migrate
```

### Step 2.4: Update Seed Data

Edit `backend/app/utils/seed.py`:
- Remove ALL CRM demo seed data (accounts, contacts, leads, opportunities, etc.)
- Add seed data for YOUR entities (sample records for testing)
- Keep core seed data (admin user, default roles, base permissions)

### Step 2.5: Remove POC Migration File

Delete old migration files that contained CRM tables:
- `backend/migrations/001_initial.sql` → replaced by your new version
- Any `002_*.sql`, `003_*.sql` that reference CRM entities

---

## Phase 3: Backend Scaffolding

**Goal: Create models, schemas, services, and routes for each entity. Remove ALL POC backend code.**

### Step 3.1: Create Models (`backend/app/models/{entity}.py`)

For EACH entity, following `skills/mvp-architecture.md` and `skills/orm-patterns.md`:

```python
from typing import Optional
from pydantic import BaseModel, field_validator
from datetime import datetime
from app.models.base import AppBaseModel

class {Entity}(AppBaseModel):
    model_config = {"coerce_numbers_to_str": True}

    id: str
    # Entity-specific fields
    name: Optional[str] = None
    # ... all fields matching DB columns

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is None:
            return None
        if isinstance(v, bool):
            raise ValueError('Name cannot be boolean')
        return str(v).strip()

    @staticmethod
    def _table() -> str:
        return "{entity_plural}"

    def to_response(self) -> dict:
        return self.model_dump()
```

### Step 3.2: Update Models **init**

Edit `backend/app/models/__init__.py`:
- Add import for each new model
- Remove ALL POC model imports (account, contact, lead, opportunity, activity, notes, cases, products)
- Keep core models: user, role, event, event_filter, table_change

### Step 3.3: Create Schemas (`backend/app/schemas/{entity}.py`)

For EACH entity, following `skills/validation-patterns.md`:

```python
from typing import Optional, Any
from pydantic import BaseModel, field_validator
from datetime import datetime

class {Entity}Create(BaseModel):
    model_config = {"coerce_numbers_to_str": True}
    # Fields that are required for creation
    name: str
    # ... other fields

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Any) -> Optional[str]:
        if v is None or v == '':
            raise ValueError('Name is required')
        if isinstance(v, bool):
            raise ValueError('Name cannot be boolean')
        return str(v).strip()


class {Entity}Update(BaseModel):
    model_config = {"coerce_numbers_to_str": True}
    # All fields optional for update
    name: Optional[str] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, bool):
            raise ValueError('Name cannot be boolean')
        return str(v).strip()


class {Entity}Response(BaseModel):
    id: str
    # All fields returned to client
    name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
```

### Step 3.4: Update Schemas **init**

Edit `backend/app/schemas/__init__.py`:
- Add import for each new Create, Update, Response schema
- Remove ALL POC schema imports

### Step 3.5: Create Services (`backend/app/services/{entity}_service.py`)

For EACH entity, following `skills/mvp-architecture.md` and `skills/observability-patterns.md`:

```python
from typing import Optional
from app.core.observability import logger, async_trace
from app.orm import get_orm
from app.models.{entity} import {Entity}

class {Entity}Service:
    @async_trace("{entity}_service.list")
    async def list(self, limit: int = 100, offset: int = 0, **filters):
        orm = get_orm()
        builder = orm.query({Entity}).eq("is_deleted", False)
        # Apply filters
        for key, value in filters.items():
            if value is not None:
                builder = builder.eq(key, value)
        builder = builder.order("created_at", "desc").limit(limit).offset(offset)
        items = await orm.find_by({Entity}, builder)
        total = await orm.count({Entity}, orm.query({Entity}).eq("is_deleted", False))
        return items, total

    @async_trace("{entity}_service.get_by_id")
    async def get_by_id(self, id: str) -> Optional[{Entity}]:
        orm = get_orm()
        return await orm.find_by_id({Entity}, id)

    @async_trace("{entity}_service.create")
    async def create(self, data: dict, user_id: str) -> {Entity}:
        orm = get_orm()
        data["owner_id"] = user_id
        result = await orm.create({Entity}, data)
        logger.info("{entity}.created", entity_id=result.id, actor=user_id)
        return result

    @async_trace("{entity}_service.update")
    async def update(self, id: str, data: dict) -> Optional[{Entity}]:
        orm = get_orm()
        result = await orm.update({Entity}, id, data)
        logger.info("{entity}.updated", entity_id=id)
        return result

    @async_trace("{entity}_service.delete")
    async def delete(self, id: str) -> None:
        orm = get_orm()
        await orm.update({Entity}, id, {"is_deleted": True, "deleted_at": "NOW()"})
        logger.info("{entity}.deleted", entity_id=id)

# Singleton
{entity}_service = {Entity}Service()
```

### Step 3.6: Create Routes (`backend/app/api/v1/{entity}.py`)

For EACH entity, following `skills/mvp-architecture.md`:

```python
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.rbac import rbac, PermissionType
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.{entity} import {Entity}Create, {Entity}Update, {Entity}Response
from app.services.{entity}_service import {entity}_service
from app.core.pagination import PaginatedResponse

router = APIRouter(prefix="/{entity_plural}", tags=["{Entity}"])

@router.get("", response_model=PaginatedResponse[{Entity}Response])
async def list_{entity_plural}(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(rbac.require_permission(PermissionType.{DOMAIN}_{ACTION})),
):
    items, total = await {entity}_service.list(limit=limit, offset=offset)
    return {"data": [item.to_response() for item in items], "total": total, "limit": limit, "offset": offset}

@router.get("/{id}", response_model={Entity}Response)
async def get_{entity}(
    id: str,
    current_user: User = Depends(rbac.require_permission(PermissionType.{DOMAIN}_READ)),
):
    item = await {entity}_service.get_by_id(id)
    if not item or item.is_deleted:
        raise HTTPException(status_code=404, detail="{Entity} not found")
    return item.to_response()

@router.post("", response_model={Entity}Response, status_code=201)
async def create_{entity}(
    data: {Entity}Create,
    current_user: User = Depends(rbac.require_permission(PermissionType.{DOMAIN}_CREATE)),
):
    item = await {entity}_service.create(data.model_dump(), user_id=current_user.id)
    return item.to_response()

@router.patch("/{id}", response_model={Entity}Response)
async def update_{entity}(
    id: str,
    data: {Entity}Update,
    current_user: User = Depends(rbac.require_permission(PermissionType.{DOMAIN}_UPDATE)),
):
    item = await {entity}_service.update(id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="{Entity} not found")
    return item.to_response()

@router.delete("/{id}", status_code=204)
async def delete_{entity}(
    id: str,
    current_user: User = Depends(rbac.require_permission(PermissionType.{DOMAIN}_DELETE)),
):
    item = await {entity}_service.get_by_id(id)
    if not item or item.is_deleted:
        raise HTTPException(status_code=404, detail="{Entity} not found")
    await {entity}_service.delete(id)
```

### Step 3.7: Register Routes

Edit `backend/app/api/v1/__init__.py`:
- Add import: `from app.api.v1.{entity} import router as {entity}_router`
- Add `{entity}_router` to `__all__`

Edit `backend/app/main.py`:
- Add: `app.include_router({entity}_router, prefix="/api/v1")`

### Step 3.8: Remove POC Backend Code

**Delete these files (complete removal, no content needed):**
```
backend/app/models/account.py
backend/app/models/contact.py
backend/app/models/lead.py
backend/app/models/opportunity.py
backend/app/models/activity.py
backend/app/models/notes.py
backend/app/models/cases.py
backend/app/models/products.py

backend/app/schemas/account.py
backend/app/schemas/contact.py
backend/app/schemas/lead.py
backend/app/schemas/opportunity.py
backend/app/schemas/activity.py
backend/app/schemas/notes.py
backend/app/schemas/cases.py
backend/app/schemas/products.py

backend/app/services/account_service.py
backend/app/services/contact_service.py
backend/app/services/lead_service.py
backend/app/services/opportunity_service.py
backend/app/services/activity_service.py
backend/app/services/notes_service.py
backend/app/services/cases_service.py
backend/app/services/products_service.py

backend/app/api/v1/accounts.py
backend/app/api/v1/contacts.py
backend/app/api/v1/leads.py
backend/app/api/v1/opportunities.py
backend/app/api/v1/activities.py
backend/app/api/v1/notes.py
backend/app/api/v1/cases.py
backend/app/api/v1/products.py
```

**Update init files to remove POC references:**
- `backend/app/models/__init__.py` — remove POC model imports
- `backend/app/schemas/__init__.py` — remove POC schema imports
- `backend/app/api/v1/__init__.py` — remove POC route imports
- `backend/app/main.py` — remove POC router includes

### Step 3.9: Update RBAC Permissions

Edit `backend/app/core/rbac.py`:
- Remove CRM-specific PermissionType values
- Add new PermissionType values for your domain entities
- Update `ROLE_PERMISSIONS` mapping

### Step 3.10: Update Change Detection API

The `GET /api/v1/changes/check` endpoint and `ChangeService` are structural and stay. Verify:
- `TableChange` model exists
- `table_changes` table exists in your migration
- All your new tables have `notify_table_change` triggers

---

## Phase 4: Frontend Scaffolding

**Goal: Create types, API clients, hooks, pages, and i18n for each entity. Remove ALL POC frontend content.**

### Step 4.1: Create Types (`frontend/src/types/{entity}.ts`)

For EACH entity:
```typescript
export interface {Entity} {
  id: string
  name: string
  // ... entity-specific fields
  created_at: string
  updated_at: string
}

export interface {Entity}Create {
  name: string
  // ... fields for creation
}

export interface {Entity}Update {
  name?: string
  // ... optional fields for update
}
```

### Step 4.2: Create API Client (`frontend/src/api/{entity}.ts`)

For EACH entity:
```typescript
import api from './client'
import type { {Entity}, {Entity}Create, {Entity}Update } from '@/types/{entity}'
import type { PaginatedResponse } from '@/types'

export const {entity}Api = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<{Entity}>>('/{entity_plural}', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<{Entity}>(`/{entity_plural}/${id}`).then(r => r.data),

  create: (data: {Entity}Create) =>
    api.post<{Entity}>('/{entity_plural}', data).then(r => r.data),

  update: (id: string, data: {Entity}Update) =>
    api.patch<{Entity}>(`/{entity_plural}/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/{entity_plural}/${id}`),
}
```

### Step 4.3: Create React Query Hooks (`frontend/src/hooks/use{Entity}Query.ts`)

For EACH entity, following `skills/preloading-patterns.md`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { {entity}Api } from '@/api/{entity}'
import type { {Entity}Create, {Entity}Update } from '@/types/{entity}'
import { acknowledgeUserChanges } from './useTableChanges'

const ENTITY_KEY = '{entity_plural}'

export function use{Entity}List(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [ENTITY_KEY, 'list', filters],
    queryFn: () => {entity}Api.list(filters),
  })
}

export function use{Entity}(id: string) {
  return useQuery({
    queryKey: [ENTITY_KEY, id],
    queryFn: () => {entity}Api.getById(id),
    enabled: !!id,
  })
}

export function useCreate{Entity}() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {Entity}Create) => {entity}Api.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENTITY_KEY] })
      acknowledgeUserChanges()
    },
  })
}

export function useUpdate{Entity}() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: {Entity}Update }) => {entity}Api.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENTITY_KEY] })
      acknowledgeUserChanges()
    },
  })
}

export function useDelete{Entity}() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => {entity}Api.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENTITY_KEY] })
      acknowledgeUserChanges()
    },
  })
}
```

### Step 4.4: Create Pages (`frontend/src/pages/{entity}/`)

**IMPORTANT — User UI Instructions First:** If the user provided any HTML, CSS, layout descriptions, color schemes, or visual specifications, apply them EXACTLY. The patterns below are defaults — user instructions override them. Do not invent your own visual interpretation.

**Responsiveness is NON-NEGOTIABLE:** Every page MUST be tested and verified at 320px, 768px, 1024px, and 1440px in BOTH LTR and RTL directions. Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) exclusively. Tables become cards on mobile, forms are single-column on mobile, navigation collapses to hamburger.

**Dark Mode is MANDATORY:** Every new page/component MUST include `dark:` Tailwind variants for ALL color classes. The template includes `ThemeContext`, `ThemeToggle`, and `ThemeProvider` — these are immutable. When creating new pages, add `dark:bg-*`, `dark:text-*`, `dark:border-*`, etc. for every color utility. Missing dark mode support is a VIOLATION. Test every page in both light and dark mode.

**Component Organization:** Group related fields logically using cards/sections. Maintain consistent spacing throughout. Ensure clear visual hierarchy with distinct heading/body text sizes.

Following `skills/frontend-patterns.md` (sections 5.4, 7.6, 7.7, 7.8):

#### List.tsx
- Table display with all relevant columns
- Search/filter bar
- Pagination component
- Delete button with confirmation
- Create button linking to Form page
- SkeletonTable loading state
- Empty state message
- Error state with retry
- `use{Entity}List()` hook

#### Detail.tsx (for main entities only, not junction)
- Metadata display (all fields read-only)
- Edit button → Form page
- Delete button with confirmation
- Back to list link
- FK context for nested entity creation (pass ID via search params)
- `use{Entity}(id)` hook

#### Form.tsx
- Create/Edit mode (detect from URL: has ID = edit)
- `react-hook-form` + `zod` for form state (per `skills/frontend-patterns.md` §5.2)
- Per-field blur validation (per `skills/frontend-patterns.md` §7.6)
- FK dropdowns using referenced entity's list query (per §7.8)
- `useCreate{Entity}()` / `useUpdate{Entity}()` mutations
- `acknowledgeUserChanges()` in onSuccess (per §7.7)
- Loading/error states

### Step 4.5: Update i18n

Edit `frontend/src/i18n/en.json` and `frontend/src/i18n/ar.json`:
- Remove ALL CRM-related keys
- Add keys for your entities

Pattern:
```json
{
  "{entity}": {
    "title": "{Entity} Management",
    "list": "{Entity} List",
    "create": "Create {Entity}",
    "edit": "Edit {Entity}",
    "detail": "{Entity} Details",
    "delete": "Delete {Entity}",
    "fields": {
      "name": "Name",
      "status": "Status",
      "created_at": "Created At"
    },
    "messages": {
      "created": "{Entity} created successfully",
      "updated": "{Entity} updated successfully",
      "deleted": "{Entity} deleted successfully",
      "confirm_delete": "Are you sure you want to delete this {Entity}?"
    }
  }
}
```

**Every key in `en.json` MUST exist in `ar.json`** — missing keys cause crashes.

### Step 4.6: Register Routes & Navigation

Edit `frontend/src/App.tsx`:
```tsx
const {Entity}List = React.lazy(() => import('@/pages/{entity}/List'))
const {Entity}Detail = React.lazy(() => import('@/pages/{entity}/Detail'))
const {Entity}Form = React.lazy(() => import('@/pages/{entity}/Form'))

// In Routes:
<Route path="/{entity_plural}" element={<ProtectedRoute><{Entity}List /></ProtectedRoute>} />
<Route path="/{entity_plural}/new" element={<ProtectedRoute><{Entity}Form /></ProtectedRoute>} />
<Route path="/{entity_plural}/:id" element={<ProtectedRoute><{Entity}Detail /></ProtectedRoute>} />
<Route path="/{entity_plural}/:id/edit" element={<ProtectedRoute><{Entity}Form /></ProtectedRoute>} />
```

Edit `frontend/src/components/Layout/Header.tsx`:
- Add navigation links for each entity
- Use `PermissionGate` to conditionally show links based on user permissions

### Step 4.7: Update Route Constants

Edit `frontend/src/utils/constants.ts`:
```typescript
export const APP_NAME = '{YourProjectName}'
export const ROUTES = {{
  {ENTITY_PLURAL}: '/{entity_plural}',
  {ENTITY_PLURAL}_NEW: '/{entity_plural}/new',
  // ...
}}
```

### Step 4.8: Update AppPreloader

Edit `frontend/src/components/AppPreloader.tsx`:
- Remove POC preloads (users.list, events.list if those were CRM-specific)
- Add preloads for your entities:
```typescript
queryClient.prefetchQuery({
  queryKey: ['{entity_plural}', 'list', { limit: 100 }],
  queryFn: () => {entity}Api.list({ limit: 100 }),
  staleTime: 30_000,
})
```

### Step 4.9: Remove POC Frontend Code

**Delete these directories and files (complete removal):**
```
frontend/src/pages/accounts/          (entire directory)
frontend/src/pages/contacts/          (entire directory)
frontend/src/types/account.ts
frontend/src/types/contact.ts
frontend/src/api/accounts.ts
frontend/src/api/contacts.ts
frontend/src/hooks/useAccountsQuery.ts
frontend/src/hooks/useContactsQuery.ts
```

**Clean up these files (remove POC references):**
- `frontend/src/pages/Home.tsx` — Replace ALL content with project's landing page
- `frontend/src/pages/Dashboard.tsx` — Replace ALL content with project-specific dashboard

### Step 4.10: Update Home Page & Dashboard

#### Home.tsx
- Create project-specific hero/landing section
- Show login/register CTA if not authenticated
- Show brief project description

#### Dashboard.tsx
- Project-specific aggregate cards/widgets
- Use `useAuth()` for user context
- Use `execute_raw` with `reason="dashboard aggregate"` for aggregate queries
- Use `SYSTEM_READ` permission

---

## Phase 5: Infrastructure & CI/CD Configuration

**Goal: Ensure Docker, deployment, and CI/CD are configured for the new project name.**

### Step 5.1: Docker Configuration

| File | Action |
|------|--------|
| `Dockerfile.backend` | Update labels (`org.opencontainers.image.title`, etc.) |
| `Dockerfile.frontend` | Update labels |
| `docker-compose.yml` | Change `container_name`, `image`, `project` to new name |
| `docker-compose.dev.yml` | Update any overridden names |
| `deploy/docker-compose.prod.yml` | Update ALL names and references |
| `.dockerignore` | Verify correct (keep as-is) |

### Step 5.2: CI/CD Pipeline

Edit `.github/workflows/ci.yml` (or equivalent):
- Update image tags: `fullstack-backend` → `{project}-backend`
- Update job/stage names
- Update any hardcoded project paths

Edit `.github/workflows/deploy.yml` (or equivalent):
- Same as above
- Update deployment target URLs

### Step 5.3: Deployment Configs

| File | Action |
|------|--------|
| `deploy/render.yaml` | Update service names, repo URLs |
| `frontend/vercel.json` | Verify project name reference |
| `deploy/aws/ecs-task-definition.json` | Update family, container names, SSM parameter paths |
| `deploy/nginx.conf` | Verify backend proxy target matches new container name |
| `frontend/nginx/default.conf` | Verify correctness |

### Step 5.4: Environment Configuration

Verify these files are correctly configured:
- `.env.example` — update `APP_NAME`, `VITE_API_BASE_URL`
- Verify no hardcoded template defaults remain

Generate new secrets:
```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"
# Generate JWT_SECRET
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Phase 6: Testing, Cleanup & Final Verification

**Goal: Ensure everything works, POC content is gone, and all validations pass.**

### Step 6.1: Create Tests

#### Backend Tests

**Service Tests** (`backend/tests/unit/test_{entity}_service.py`):
```python
# Test: list with pagination
# Test: get_by_id returns correct item
# Test: create with valid data
# Test: update changes fields
# Test: delete sets is_deleted
# Test: get_by_id returns None for deleted
```

**API Integration Tests** (`backend/tests/integration/test_{entity}_api.py`):
```python
# Test: list returns 200 with paginated response
# Test: get returns 200 for existing, 404 for missing
# Test: create returns 201 with created entity
# Test: update returns 200 with updated fields
# Test: delete returns 204
# Test: unauthenticated returns 401
# Test: unauthorized returns 403
# Test: validation errors return 422
```

**Remove POC tests:**
- `backend/tests/unit/test_account_service.py`
- `backend/tests/integration/test_accounts_api.py`
- `backend/tests/integration/test_contacts_api.py`
- Any other CRM-specific test files

#### Frontend Tests

Following `skills/testing-patterns.md`:

**Hook Tests** (`frontend/src/tests/unit/use{Entity}Query.test.ts`):
```typescript
// Test: useQuery returns expected data shape
// Test: useMutation calls correct API endpoint
// Test: onSuccess invalidates queries
```

**Component Tests** (`frontend/src/tests/integration/{Entity}List.test.tsx`):
```typescript
// Test: renders table with data
// Test: shows loading skeleton
// Test: shows empty state
// Test: shows error state with retry
// Test: delete button works with confirmation
```

### Step 6.2: Update Test Factories

Edit `backend/tests/factories/`:
- Remove CRM factories if they exist
- Add factories for your entities:
```python
# {Entity}Factory
class {Entity}Factory:
    @staticmethod
    def build(**overrides) -> dict:
        return {
            "id": str(uuid4()),
            "name": f"Test {Entity} {uuid4().hex[:8]}",
            "owner_id": "user-1",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            **overrides
        }
```

### Step 6.3: Clean Up Seed Data

Edit `backend/app/utils/seed.py`:
- Remove all CRM demo data (accounts, contacts, leads, etc.)
- Add seed data for your entities
- Keep core seed data: admin user, default roles, base permissions

### Step 6.4: Final POC Content Sweep

Search for and remove any remaining POC references:

```bash
# Check for CRM references in code
grep -ri "account\|contact\|lead\|opportunity\|activity\|cases\|product" --include="*.py" --include="*.ts" --include="*.tsx" backend/app/ frontend/src/
# Manually inspect each match — if it's POC content, remove/replace
```

**Check these files specifically for POC remnants:**
- `backend/app/core/rbac.py` — remove CRM permissions, add your domain permissions
- `backend/app/utils/seed.py` — remove CRM seed data
- `frontend/src/i18n/en.json` — remove CRM keys
- `frontend/src/i18n/ar.json` — remove CRM keys
- `frontend/src/components/Layout/Header.tsx` — remove CRM nav links
- `frontend/src/App.tsx` — remove CRM routes
- `frontend/src/utils/constants.ts` — remove CRM constants
- `frontend/src/components/AppPreloader.tsx` — remove CRM preloads
- `frontend/src/pages/Home.tsx` — replace with project landing page
- `frontend/src/pages/Dashboard.tsx` — replace with project dashboard

### Step 6.5: Run Full Validation Suite

```bash
# 1. Rule validation
scripts/validate-rules.sh

# 2. Backend lint
cd backend && ruff check . && ruff format --check .

# 3. Frontend lint
cd frontend && npm run lint

# 4. Backend tests
cd backend && python -m pytest tests/ -v --cov=app --cov-report=term-missing

# 5. Frontend tests
cd frontend && npm run test -- --coverage

# 6. Build check
cd frontend && npm run build
cd backend && python -m py_compile app/main.py  # Syntax check
```

### Step 6.6: Final Checklist

- [ ] No "fullstack-template", "fullstack", "crm", "skeleton" references remain anywhere
- [ ] All Docker images/containers renamed for new project
- [ ] Database has only: (a) core system tables, (b) project-specific tables
- [ ] All POC models, schemas, services, routes removed
- [ ] All POC frontend pages, types, API, hooks removed
- [ ] All POC i18n keys removed
- [ ] RBAC permissions updated for project domain
- [ ] Seed data updated for project entities
- [ ] README fully rewritten for project
- [ ] `make lint` passes
- [ ] `make test` passes
- [ ] `scripts/validate-rules.sh` passes
- [ ] No skill files modified
- [ ] Frontend builds successfully

---

## Appendices

### Appendix A: Entity Scaffolding Cheat Sheet

For each new entity, these files must be created/modified:

**Backend (8 files):**
1. `backend/migrations/001_initial.sql` → add CREATE TABLE
2. `backend/app/models/{entity}.py` → Pydantic model
3. `backend/app/schemas/{entity}.py` → Create, Update, Response schemas
4. `backend/app/services/{entity}_service.py` → business logic
5. `backend/app/api/v1/{entity}.py` → route handlers
6. `backend/app/api/v1/__init__.py` → register router
7. `backend/app/main.py` → include router
8. `backend/app/models/__init__.py` + `backend/app/schemas/__init__.py` → register

**Frontend (6 files):**
1. `frontend/src/types/{entity}.ts` → TypeScript interfaces
2. `frontend/src/api/{entity}.ts` → API client
3. `frontend/src/hooks/use{Entity}Query.ts` → React Query hooks
4. `frontend/src/pages/{entity}/List.tsx` → list page
5. `frontend/src/pages/{entity}/Detail.tsx` → detail page
6. `frontend/src/pages/{entity}/Form.tsx` → create/edit form

**Updates to existing:**
1. `frontend/src/i18n/en.json` + `ar.json` → add keys
2. `frontend/src/App.tsx` → add routes
3. `frontend/src/components/Layout/Header.tsx` → add nav link
4. `frontend/src/utils/constants.ts` → add route constants
5. `frontend/src/components/AppPreloader.tsx` → add preload
6. `backend/app/orm/postgres_orm.py` → add columns to VALID_COLUMNS
7. `backend/app/core/rbac.py` → add PermissionType values
8. `backend/tests/factories/{entity}_factory.py` → test factory
9. `backend/tests/unit/test_{entity}_service.py` → service tests
10. `backend/tests/integration/test_{entity}_api.py` → API tests
11. `frontend/src/tests/unit/use{Entity}Query.test.ts` → hook tests
12. `frontend/src/tests/integration/{Entity}List.test.tsx` → component tests

### Appendix B: File Rename Map

| Old (Template) | New (Project) |
|---------------|---------------|
| `fullstack-template` (repo name) | `{project-name}` |
| `fullstack-backend` (Docker) | `{project}-backend` |
| `fullstack-frontend` (Docker) | `{project}-frontend` |
| `fullstack-backend` (Render) | `{project}-backend` |
| `fullstack-frontend` (Render) | `{project}-frontend` |
| `fullstack_backend` (pyproject) | `{project}_backend` |
| `Fullstack Template` (branding) | `{Project Name}` |

### Appendix C: Technology Stack Reference

| Layer | Technology | Config File |
|-------|-----------|-------------|
| Backend | Python 3.12+, FastAPI, Pydantic v2 | `backend/requirements.txt` |
| ORM | Custom BaseORM → PostgresORM / SupabaseORM | `backend/app/orm/` |
| Database | PostgreSQL 15+ | Connection via `DATABASE_URL` |
| Logging | structlog | `backend/app/core/observability.py` |
| Tracing | OpenTelemetry | `backend/app/core/observability.py` |
| Metrics | Prometheus (prometheus-fastapi-instrumentator) | `backend/app/core/observability.py` |
| Auth | JWT (access + refresh), bcrypt | `backend/app/core/security.py` |
| RBAC | DB-backed permissions + PermissionType enum | `backend/app/core/rbac.py` |
| Rate Limit | slowapi | `backend/app/core/rate_limit.py` |
| Frontend | React 18, TypeScript, Vite | `frontend/package.json` |
| Styling | Tailwind CSS, clsx + tailwind-merge | `frontend/tailwind.config.js` |
| State | TanStack Query (server), AuthContext (auth) | `frontend/src/` |
| Forms | react-hook-form + zod | `frontend/package.json` |
| i18n | Custom JSON-based (en/ar) | `frontend/src/i18n/` |
| Testing | Pytest + MockORM (backend), Vitest (frontend) | Respective configs |
| CI/CD | GitHub Actions | `.github/workflows/` |
| Containers | Docker Compose (dev + prod) | `docker-compose.yml`, `deploy/` |
| Deploy | Render, Vercel, AWS ECS (configurable) | `deploy/` |

### Appendix D: Quick Commands

| Action | Command |
|--------|---------|
| Run migration | `make db-migrate` |
| Start dev | `make dev` |
| Run backend tests | `make test-backend` |
| Run frontend tests | `make test-frontend` |
| Run lint | `make lint` |
| Build frontend | `cd frontend && npm run build` |
| Validate rules | `scripts/validate-rules.sh` |
| Docker dev | `make start-dev` |
| Docker build | `make docker-build` |
| Seed data | `cd backend && python -m app.utils.seed` |
