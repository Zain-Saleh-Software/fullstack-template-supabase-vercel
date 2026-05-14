# CRM Database Patterns

> **Source of Truth:** This skill defines ALL CRM database rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 19.1 Core Entity Definitions

Every CRM database MUST implement the following core entities with the specified fields and constraints.

### accounts

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, `gen_random_uuid()` |
| name | TEXT | NOT NULL |
| domain | TEXT | |
| industry | TEXT | |
| account_type | TEXT | DEFAULT 'customer' — prospect, customer, vendor, partner |
| status | TEXT | DEFAULT 'active' — active, inactive, archived |
| website | TEXT | |
| phone | TEXT | |
| address_line1 | TEXT | |
| address_city | TEXT | |
| address_state | TEXT | |
| address_postal_code | TEXT | |
| address_country | TEXT | |
| metadata | JSONB | DEFAULT '{}' |
| search_text | TEXT | |
| owner_id | UUID | FK → users(id) |
| is_deleted | BOOLEAN | DEFAULT false |
| deleted_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

Indexes: name, domain, industry, owner_id, status, is_deleted. GIN on metadata and search_text. RLS enabled.

### contacts

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, `gen_random_uuid()` |
| account_id | UUID | NOT NULL, FK → accounts(id) ON DELETE CASCADE |
| first_name | TEXT | NOT NULL |
| last_name | TEXT | NOT NULL |
| email | TEXT | |
| phone | TEXT | |
| mobile_phone | TEXT | |
| job_title | TEXT | |
| department | TEXT | |
| is_primary | BOOLEAN | DEFAULT false |
| metadata | JSONB | DEFAULT '{}' |
| search_text | TEXT | |
| owner_id | UUID | FK → users(id) |
| is_deleted | BOOLEAN | DEFAULT false |
| deleted_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| UNIQUE(account_id, email) | | |

Indexes: account_id, email, owner_id, is_deleted. GIN on metadata and search_text.

### leads

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, `gen_random_uuid()` |
| first_name | TEXT | NOT NULL |
| last_name | TEXT | NOT NULL |
| email | TEXT | |
| phone | TEXT | |
| company_name | TEXT | |
| job_title | TEXT | |
| lead_source | TEXT | website, referral, campaign, inbound, other |
| lead_status | lead_status | DEFAULT 'new' — ENUM |
| converted_account_id | UUID | FK → accounts(id) |
| converted_contact_id | UUID | FK → contacts(id) |
| converted_at | TIMESTAMPTZ | |
| metadata | JSONB | DEFAULT '{}' |
| search_text | TEXT | |
| owner_id | UUID | FK → users(id) |
| is_deleted | BOOLEAN | DEFAULT false |
| deleted_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

Indexes: email, lead_status, owner_id, converted_account_id.

### opportunities

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, `gen_random_uuid()` |
| account_id | UUID | NOT NULL, FK → accounts(id) ON DELETE CASCADE |
| name | TEXT | NOT NULL |
| description | TEXT | |
| stage | opportunity_stage | DEFAULT 'prospecting' — ENUM |
| amount | NUMERIC(12,2) | |
| currency | TEXT | DEFAULT 'USD' |
| probability | INTEGER | 0-100 |
| expected_close_date | DATE | |
| actual_close_date | DATE | |
| lead_source | TEXT | |
| lost_reason | TEXT | |
| metadata | JSONB | DEFAULT '{}' |
| owner_id | UUID | FK → users(id) |
| is_deleted | BOOLEAN | DEFAULT false |
| deleted_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

Indexes: account_id, stage, owner_id, expected_close_date, (stage, expected_close_date). RLS enabled.

### activities

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, `gen_random_uuid()` |
| activity_type | activity_type | NOT NULL — ENUM |
| subject | TEXT | NOT NULL |
| description | TEXT | |
| activity_date | TIMESTAMPTZ | DEFAULT NOW() |
| duration_minutes | INTEGER | |
| account_id | UUID | FK → accounts(id) ON DELETE CASCADE |
| contact_id | UUID | FK → contacts(id) ON DELETE SET NULL |
| opportunity_id | UUID | FK → opportunities(id) ON DELETE SET NULL |
| metadata | JSONB | DEFAULT '{}' |
| owner_id | UUID | NOT NULL, FK → users(id) |
| is_deleted | BOOLEAN | DEFAULT false |
| deleted_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

Indexes: owner_id, contact_id, account_id, opportunity_id, activity_type, activity_date. Consider partitioning by month for high volume.

### notes

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, `gen_random_uuid()` |
| content | TEXT | NOT NULL |
| entity_type | TEXT | NOT NULL — 'account', 'contact', 'opportunity', 'lead', 'case' |
| entity_id | UUID | NOT NULL |
| metadata | JSONB | DEFAULT '{}' |
| owner_id | UUID | NOT NULL, FK → users(id) |
| is_pinned | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

Indexes: (entity_type, entity_id), owner_id.

### cases

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, `gen_random_uuid()` |
| subject | TEXT | NOT NULL |
| description | TEXT | |
| status | case_status | DEFAULT 'open' — ENUM |
| priority | TEXT | DEFAULT 'normal' — low, normal, high, urgent |
| case_origin | TEXT | email, phone, web, portal |
| account_id | UUID | FK → accounts(id) ON DELETE CASCADE |
| contact_id | UUID | FK → contacts(id) ON DELETE SET NULL |
| assigned_to | UUID | FK → users(id) |
| metadata | JSONB | DEFAULT '{}' |
| is_deleted | BOOLEAN | DEFAULT false |
| deleted_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

Indexes: status, assigned_to, account_id, priority.

### products

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, `gen_random_uuid()` |
| name | TEXT | NOT NULL, UNIQUE |
| description | TEXT | |
| sku | TEXT | UNIQUE |
| unit_price | NUMERIC(12,2) | |
| cost_price | NUMERIC(12,2) | |
| currency | TEXT | DEFAULT 'USD' |
| product_category | TEXT | |
| is_active | BOOLEAN | DEFAULT true |
| metadata | JSONB | DEFAULT '{}' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

RLS enabled.

---

## 19.2 ENUM Types

All CRM status fields MUST use ENUM types to enforce valid values:

```sql
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'disqualified');
CREATE TYPE opportunity_stage AS ENUM ('prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost');
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'task', 'note');
CREATE TYPE case_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
```

---

## 19.3 Relationship Matrix

| Relationship | Type | FK | On Delete |
|-------------|------|----|-----------|
| Account → Contact | 1:N | contacts.account_id | CASCADE |
| Account → Opportunity | 1:N | opportunities.account_id | CASCADE |
| Account → Case | 1:N | cases.account_id | CASCADE |
| Account → Activity | 1:N | activities.account_id | CASCADE |
| Contact → Activity | 1:N | activities.contact_id | SET NULL |
| Opportunity → Activity | 1:N | activities.opportunity_id | SET NULL |
| Lead → Account | N:1 | leads.converted_account_id | SET NULL |
| Lead → Contact | N:1 | leads.converted_contact_id | SET NULL |
| User → Account (owner) | 1:N | accounts.owner_id | SET NULL |
| User → Contact (owner) | 1:N | contacts.owner_id | SET NULL |
| User → Opportunity (owner) | 1:N | opportunities.owner_id | SET NULL |
| User → Activity (owner) | 1:N | activities.owner_id | SET NULL |
| User → Lead (owner) | 1:N | leads.owner_id | SET NULL |
| User → Case (assignee) | 1:N | cases.assigned_to | SET NULL |

---

## 19.4 Data Integrity Rules

- **UUID Primary Keys:** Every table MUST use UUID PK with `gen_random_uuid()`.
- **Foreign Key Constraints:** Every relationship MUST be enforced at DB level with FK constraints and explicit ON DELETE rules.
- **Unique Constraints:** Email uniqueness per account for contacts. Account name uniqueness. Product SKU uniqueness.
- **CHECK Constraints:** Opportunity amount must be positive. Probability must be 0-100. Duration must be positive.
- **NUMERIC for Currency:** All monetary values MUST use `NUMERIC(12,2)`. FLOAT/REAL FORBIDDEN.
- **NOT NULL:** Core identity fields (account name, contact name, opportunity name, activity subject, case subject, product name) MUST be NOT NULL.
- **JSONB Metadata:** Every core CRM entity MUST have a `metadata` JSONB field with DEFAULT '{}' for custom field extensibility.
- **Soft Delete:** Every core CRM entity MUST have `is_deleted` (BOOLEAN DEFAULT false) and `deleted_at` (TIMESTAMPTZ) columns. Queries MUST filter `is_deleted = false` by default.
- **ENUM for Statuses:** All status/stage fields MUST use ENUM types. Free-text status fields are FORBIDDEN.

---

## 19.5 Search Rules

- **Full-Text Search:** Every searchable entity MUST have a `search_text` TEXT column.
- **auto_update_search_text Trigger:** A trigger function MUST concatenate key searchable fields into `search_text` on INSERT/UPDATE.
- **GIN Index:** Every `search_text` column MUST have a GIN tsvector index.
- **Composite Indexes:** Create composite indexes for the most common CRM query patterns:
  - accounts: `(owner_id, status)`, `(account_type, status)`
  - contacts: `(account_id, is_primary)`, `(owner_id, is_deleted)`
  - opportunities: `(stage, expected_close_date)`, `(owner_id, stage)`, `(account_id, created_at)`
  - activities: `(owner_id, activity_date)`, `(contact_id, activity_date)`, `(account_id, activity_type)`
  - leads: `(lead_status, owner_id)`, `(lead_source, created_at)`
  - cases: `(status, assigned_to)`, `(account_id, status)`, `(priority, status)`
- **Index All FKs:** Every foreign key column MUST have an index.
- **GIN on Metadata:** Every JSONB `metadata` column MUST have a GIN index.

---

## 19.6 Business Workflow Rules

### Lead Conversion
- Converting a lead MUST atomically create both an Account and a Contact (or link to existing ones).
- After conversion, `converted_account_id`, `converted_contact_id`, and `converted_at` MUST be set.
- Lead status MUST be set to 'converted'.
- A converted lead MUST be editable but flagged as historical.
- Lead conversion MUST emit an event: `"lead.converted"` (passes Golden Question).

### Opportunity Stage Changes
- Every stage change MUST emit an event: `"opportunity.stage_changed"` with metadata containing `{from_stage, to_stage}`.
- Once an opportunity reaches 'won' or 'lost', it MUST NOT move to an earlier stage.
- 'won' opportunities MAY have `actual_close_date` auto-set to NOW() if not provided.
- 'lost' opportunities MUST have `lost_reason` populated.

### Activity Ownership
- Every activity MUST have an `owner_id` referencing a user.
- Activities MUST be immutable after creation (no UPDATE of core fields; only metadata may change).
- Activity dates are informational — they represent when the activity occurred, not when it was logged.

### Case Workflow
- Case statuses flow: open → in_progress → resolved → closed.
- Transition from 'closed' to 'resolved' is allowed (reopen).
- Assignment changes MUST emit an event: `"case.assigned"`.

### Product Usage
- Products are reference data — they are not directly related to opportunities in the core schema.
- Opportunity line items (junction table opportunity_products) MAY be added in extended implementations.

---

## 19.7 Audit Rules

- **created_at / updated_at:** Every mutable table MUST have both fields.
- **updated_at Trigger:** Every mutable table MUST have a BEFORE UPDATE trigger that sets `updated_at = NOW()`.
- **table_changes Trigger:** Every mutable table MUST have an AFTER INSERT/UPDATE/DELETE STATEMENT-level trigger that inserts into `table_changes`.
- **Business Events:** The following CRM operations MUST emit events (pass Golden Question):
  - `lead.created`, `lead.converted`, `lead.status_changed`
  - `opportunity.created`, `opportunity.stage_changed`, `opportunity.won`, `opportunity.lost`
  - `case.created`, `case.status_changed`, `case.assigned`
  - `account.created`, `account.merged`

---

## 19.8 Performance Rules

- **Connection Pool:** CRM operations MUST use the existing PostgresORM connection pool.
- **Batch Operations:** `create_many()` MUST use multi-row INSERT for bulk data imports (e.g., lead imports, contact imports).
- **Keyset Pagination:** Use keyset cursor pagination (by `id` or `created_at`) for large CRM result sets instead of OFFSET.
- **SELECT Specific:** CRM queries MUST select specific columns, never `SELECT *`. Use QueryBuilder `.select()`.
- **Partitioning:** Activities and events tables SHOULD be partitioned by month for high-volume deployments.
- **No N+1:** Fetch related CRM data using JOINs or batching. Never query in a loop (e.g., fetching contacts for each account individually).

---

## 19.9 Security Rules

- **RLS Enabled:** Row-Level Security MUST be enabled on ALL CRM tables.
- **RBAC Enforcement:** Every CRM API endpoint MUST use permission-based RBAC via `rbac.require_permission(PermissionType.*)`.
- **Owner-Based Access:** Users MUST only see records they own or that are shared with their team/role.
- **Soft Delete:** CRM records MUST use soft delete to preserve audit trail. Hard DELETE is FORBIDDEN on CRM tables.
- **Metadata Validation:** JSONB metadata MUST be validated at the schema level to prevent injection of arbitrary keys.

---

## 19.10 Extended Entities (Beyond Core CRM)

The following entity groups extend the core CRM:

### Extended CRM (campaigns, quotes, orders, opportunity_products, order_items)
- Manage marketing campaigns, quotes, sales orders, and their line items
- Follow same patterns as core CRM: UUID PKs, soft-delete on main entities, RLS, triggers
- Junction tables (opportunity_products, order_items) are pure M:N — hard delete only, no update

### HR Module (departments, positions, employees)
- Employee records include comprehensive fields: salary, emergency contact, employment type/status
- Departments support hierarchical organization (parent_department_id)
- Dashboard aggregates employee counts by status and department totals

### Knowledge Base (kb_categories, kb_articles)
- Categorize help articles with hierarchical categories
- Articles support draft/published/archived status workflow
- Tags stored as TEXT[] with GIN index

### Territory/Account Management (territories, account_territories)
- Hierarchical territories by geographic region
- Many-to-many account-to-territory mapping with primary flag

### AI Integration (action_log, ai_recommendations)
- Track user actions for AI pattern recognition
- Cached recommendations with apply/dismiss workflow
- Action types: view, create, update, delete, convert, assign, status_change, stage_change

---

## 19.11 Extended Entity Patterns

### Dashboard Aggregates
- Use `execute_raw` with `reason="dashboard aggregate"` for aggregate queries
- Parameterized queries for all filters (e.g., `$1` for date ranges)
- Dashboard endpoint uses `SYSTEM_READ` permission

### Junction Table Pattern
- Tables: opportunity_products, order_items, account_territories
- No `is_deleted` / `deleted_at` columns
- No UPDATE endpoint — CREATE + READ + DELETE only
- No Detail page — List + Create forms only

### Non-CRM Entity Conventions
- KB articles, campaigns, and orders use TEXT status fields (not ENUM) for flexibility
- Employees use ENUM for employment_status and employment_type
- HR entities use `metadata` JSONB for extensibility

---

## 19.12 Adding a New Entity (Generic)

1. Define migration in `backend/migrations/` (sequential number, SQL with ENUMs + table + indexes + RLS + triggers)
2. Add model in `app/models/{entity}.py` with `_table()` and `to_response()`
3. Add schemas in `app/schemas/{entity}.py` (Create, Update, Response)
4. Add service in `app/services/{entity}_service.py` with `@async_trace`, events
5. Add route in `app/api/v1/{entity}.py` — thin handlers with RBAC + pagination
6. Register model in `app/models/__init__.py`, schema in `app/schemas/__init__.py`, route in `app/api/v1/__init__.py` and `app/main.py`
7. Add PermissionType values in `app/core/rbac.py`
8. Add frontend: types, API client, hooks, pages, routes, nav, i18n
9. Add factories + tests + seed data

---

## Hard Rules

1. **All 8 core CRM entities** (accounts, contacts, leads, opportunities, activities, notes, cases, products) MUST exist as defined in this skill.
2. **UUID PKs** on ALL tables — no exceptions.
3. **FK constraints** on ALL relationships — no app-level-only enforcement.
4. **ENUM types** for ALL status/stage fields in core CRM — free-text status fields are FORBIDDEN for core CRM.
5. **NUMERIC(12,2)** for ALL monetary values — FLOAT/REAL FORBIDDEN.
6. **JSONB metadata** on ALL core CRM entities — enables custom field extensibility.
7. **Soft delete** (`is_deleted` + `deleted_at`) on ALL core CRM and main entities — hard DELETE FORBIDDEN on main tables.
8. **Full-text search** via `search_text` + GIN index on searchable CRM entities.
9. **Index ALL FKs** — every foreign key column MUST have an index.
10. **RLS** enabled on ALL tables.
11. **Lead conversion** MUST atomically create account + contact.
12. **Opportunity stage changes** MUST emit events — every transition is auditable.
13. **Activities MUST have an owner** — `owner_id` is NOT NULL.
14. **RBAC on every API endpoint** — permission-based enforcement.
15. **No N+1 queries** — fetch related data via JOINs or batching.
16. **Dashboard aggregates** use `execute_raw` with `reason="dashboard aggregate"`.
17. **Junction tables** omit soft-delete — hard delete only.
18. **All tables** MUST have change-data-capture triggers (`notify_table_change`).
19. **Bilingual i18n** — every new entity MUST have keys in both en.json and ar.json.
