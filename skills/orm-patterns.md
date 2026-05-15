# Database & ORM Patterns

> **Source of Truth:** This skill defines ALL database and ORM rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 2.1 Schema Design

- **Primary Keys:** Every table MUST use UUID primary keys (`gen_random_uuid()`). Pydantic models MUST use `id: str` for the primary key field. The ORM layer (`PostgresORM._convert_row`) automatically converts asyncpg's native `uuid.UUID` objects to strings before model construction, so no special validators are needed in models.
- **Audit Fields:** Every table MUST have `created_at` (TIMESTAMPTZ) and `updated_at` (TIMESTAMPTZ with auto-update trigger).
- **Constraints:** Uniqueness (e.g., email) MUST be enforced at the DB level (UNIQUE constraint), not just the app level.
- **Row-Level Security (RLS):** RLS MUST be enabled on all tables.
- **Auto-Update Trigger:** Every table MUST have a trigger that auto-updates `updated_at` on row modification.
- **Change Tracking:** Every mutable table MUST have a `notify_table_change` trigger (AFTER INSERT/UPDATE/DELETE, STATEMENT-level) that inserts into `table_changes`.

---

## 2.2 ORM Architecture

```
BaseORM (abstract) ← SupabaseORM, PostgresORM
                    ↓
            get_orm() factory (selects based on settings.db_type)
                    ↓
              QueryBuilder (chained filters)
```

- **BaseORM:** All DB implementations MUST inherit from abstract `BaseORM`.
- **Implementations:** Two implementations exist — `PostgresORM` (asyncpg) and `SupabaseORM` (httpx REST).
- **Factory:** Use `get_orm()` factory which selects implementation based on `settings.db_type` ("supabase" or "postgres").
- **Cleanup:** Call `close_orm()` on application shutdown to release pool/connections.
- **QueryBuilder:** Use chained filter methods (`.eq()`, `.gt()`, `.in_()`) exclusively. Never build raw strings in the service layer.
- **Column Validation (PostgresORM):** Every column name in queries MUST be validated against `VALID_COLUMNS` dict before execution. Unknown columns raise `ValueError`.

### Files
- `app/orm/base.py` — Abstract interface (all ORMs implement this)
- `app/orm/query.py` — QueryBuilder with chained filter methods
- `app/orm/supabase_orm.py` — Supabase REST API implementation
- `app/orm/postgres_orm.py` — Direct asyncpg PostgreSQL implementation
- `app/orm/__init__.py` — `get_orm()` factory, `close_orm()` cleanup

### UUID Handling
- PostgreSQL UUID columns are returned by asyncpg as Python `uuid.UUID` objects.
- `PostgresORM._convert_row()` automatically converts all `uuid.UUID` values to strings before model construction.
- Pydantic models MUST use `id: str` — no special validators needed.

### Type Consistency (DB <-> Model)
- Model field types MUST exactly match DB column types (e.g., `lat`/`lng` stored as `double precision` in DB MUST be `float` in the model and schemas, NOT `str`).
- Any mismatch between Pydantic model types and actual DB column types will cause 500 errors at runtime when the ORM attempts to construct models from DB rows.
- Always verify DB column types via migration SQL or `\d tablename` in psql before defining model/schema types.
- `decimal`/`numeric` DB types map to `float` in Pydantic (use `Optional[float]` for nullable numeric columns).
- Coordinate fields (`lat`, `lng`) MUST use `float`, NOT `str`.

### Model Conventions
Every model MUST have:
```python
@staticmethod
def _table() -> str:
    return "table_name"
```

---

## 2.3 ORM CRUD Standards

| Method | Description |
|--------|-------------|
| `find_all(model, limit, offset)` | Get all records with pagination |
| `find_by_id(model, id)` | Get by primary key |
| `find_by(model, builder, limit, offset)` | Filtered list |
| `find_one_by(model, builder)` | Single result or None |
| `create(model, data)` | Insert one |
| `create_many(model, data_list)` | Batch insert (MUST use multi-row INSERT syntax — NEVER row-by-row) |
| `update(model, id, data)` | Update by ID |
| `update_by(model, builder, data)` | Update matching (REQUIRES at least one filter — raise error if none) |
| `delete(model, id)` | Delete by ID |
| `delete_by(model, builder)` | Delete matching (REQUIRES at least one filter — raise error if none) |
| `count(model, builder?)` | Total count. MUST accept optional QueryBuilder for filtered counts. |
| `execute_raw(query, params)` | Raw SQL. FORBIDDEN in API handlers. Requires `reason` parameter. |

---

## 2.4 QueryBuilder Methods

- `.eq()`, `.neq()` — Equality
- `.gt()`, `.gte()`, `.lt()`, `.lte()` — Comparisons
- `.like()`, `.ilike()` — Pattern matching
- `.is_null()`, `.is_not_null()` — Null checks
- `.in_()` — IN clause
- `.order(column, direction)` — Sorting
- `.limit()`, `.offset()` — Pagination
- `.range(start, end)` — Range queries
- `.select(*columns)` — Specific columns (default: all)

### Usage Example
```python
orm = get_orm()
users = await orm.find_by(
    User,
    orm.query(User)
        .eq("is_active", True)
        .gt("age", 18)
        .like("email", "%@company.com")
        .in_("role", ["admin", "mod"])
        .order("created_at", "desc")
        .limit(10)
        .offset(0)
)
```

---

## 2.5 Performance & Database Performance

- **Indexing:** Every column used in `WHERE`, `JOIN`, or `ORDER BY` MUST be indexed.
- **Composite Indexes:** Add composite indexes for common query patterns: `permissions (action, resource)`, `events (entity_type, created_at)`, `events (actor_id, created_at)`, `users (role, created_at)`.
- **Events Partitioning:** Events table MUST be partitioned by month range on `created_at` for production. Include auto-partition function for pg_cron.
- **Pool Management:** `max_size = min(workers * 4, 50)`. `min_size = max(settings.db_pool_min_size, 2)`.
- **Pool Retry:** Pool creation MUST have retry logic with exponential backoff (5 attempts, starting at 1s).
- **Command Timeout:** Every query MUST have `command_timeout=30` (max 30s).
- **TLS/SSL:** Database connections MUST use `ssl='require'` (or equivalent `sslmode=require`).
- **Certificate Verification:** Where possible, database connections MUST verify the server certificate against a trusted CA (`sslmode=verify-full` or equivalent). At minimum, TLS encryption MUST be enforced — never send credentials or data over an unencrypted connection.
- **No N+1:** Fetch related data using JOINs or batching; never query in a loop.
- **Selectivity:** `SELECT *` is FORBIDDEN in production. Always select specific columns. Use QueryBuilder `.select()`.
- **Keyset Cursor:** Support keyset cursor pagination alongside offset pagination for large datasets.

---

## 2.6 ORM Observability

- EVERY ORM method MUST be decorated with BOTH:
  - `@async_trace("orm.{impl}.{operation}")` — e.g., `@async_trace("orm.postgres.find_by")`
  - `@observe_db("{operation}", "{actual_table_name}")` — MUST use actual table name, NEVER `"dynamic"`
- "Slow query" threshold: log warning for queries exceeding 1000ms.
- Every ORM operation MUST have structured logging (start, completion, errors).
- Slow queries (>500ms in existing codebases, >1000ms in new code) MUST be logged with full SQL.

---

## 2.7 Database Change Tracking

### `table_changes` Table
A dedicated log table (`table_changes`) MUST exist with columns: `id` (UUID PK), `table_name` (TEXT), `operation` (INSERT/UPDATE/DELETE), `changed_at` (TIMESTAMPTZ). Created via migration.

### Trigger Function
`notify_table_change()` trigger function MUST be defined. It inserts a row into `table_changes` with `TG_TABLE_NAME` and `TG_OP`. It MUST be STATEMENT-level (not row-level) to avoid excessive writes on batch operations.

### Tracked Tables
Every mutable table (users, roles, permissions, events) MUST have `AFTER INSERT OR UPDATE OR DELETE` triggers calling `notify_table_change()`.

### Retention
`table_changes` records older than 7 days MUST be periodically pruned (via pg_cron or scheduled job) to prevent unbounded growth.

### Model Registration
- A `TableChange` Pydantic model MUST exist in `app/models/table_change.py` with `_table()` returning `"table_changes"`.
- `"table_changes"` column set MUST be added to `VALID_COLUMNS` in `postgres_orm.py`.

---

## 2.8 Database Migrations

- Migration files MUST be sequentially numbered (`001_initial.sql`, `002_...`, `003_...`).
- Migrations MUST run and succeed BEFORE application deployment starts.
- Partition migrations: rename old table, create partitioned table, copy data, recreate indexes, re-enable RLS.
- All migration SQL MUST be idempotent where possible.

---

## Hard Rules

### SQL Injection — ZERO TOLERANCE
- ALL dynamic values MUST use parameterized queries (`$1`, `$2`, ...). f-string interpolation is FORBIDDEN.
- LIMIT and OFFSET MUST be passed as query parameters, NOT interpolated into SQL strings.
- `execute_raw_unsafe` MUST only be used for read-only operations in controlled migrations.

### Filter Safety
- `update_by()` and `delete_by()` MUST raise an error if no filters are provided. Affecting all rows without explicit intent is FORBIDDEN.
- Filter-building logic MUST NOT be duplicated across `find_by`, `update_by`, `delete_by`. Extract into a shared helper.

### Performance
- `create_many()` MUST use multi-row INSERT syntax: `INSERT INTO "t" (cols) VALUES ($1,$2),($3,$4),...`.
- Connection pool size: `max_size = min(workers * 4, 50)`.
- Pool creation MUST have retry logic with exponential backoff.
- Every query MUST have `command_timeout` (max 30s).

### Security
- Database connections MUST use TLS/SSL (at minimum `ssl='require'`). Where possible, verify the server certificate (`sslmode=verify-full`).
- Supabase service role key MUST NOT be used for read operations. Use anon key for reads.
- `SELECT *` is FORBIDDEN in production — always select specific columns.

### Observability
- EVERY ORM method MUST be decorated with BOTH:
  - `@async_trace("orm.{impl}.{operation}")` — e.g., `@async_trace("orm.postgres.find_by")`
  - `@observe_db("{operation}", "{actual_table_name}")` — NEVER use `"dynamic"` as table name
- Slow queries (>1000ms) MUST be logged with full SQL.

### Filtered Count
- `count()` MUST accept an optional `QueryBuilder` parameter for filtered counts.
- Calling `count()` without filters when a filtered count is needed is a BUG.

### Testing
- Tests MUST use a test database or in-memory DB, NOT MockORM for ORM testing.
- MockORM MUST support ALL filter operators, not just `eq`.
- `count_events` tests MUST verify all filter parameters (entity_type, event_type, actor_id).
