# Custom ORM Patterns

> **MANDATORY:** ALL rules in `RULES.md` apply. This skill supplements, never overrides, `RULES.md`.
> Every PR, commit, and deployment MUST comply with `RULES.md`. Deviations require an ADR.

## Architecture
```
BaseORM (abstract) ← SupabaseORM, PostgresORM
                    ↓
            get_orm() factory (selects based on settings.db_type)
                    ↓
              QueryBuilder (chained filters)
```

## Files
- `app/orm/base.py` — Abstract interface (all ORMs implement this)
- `app/orm/query.py` — QueryBuilder with chained filter methods
- `app/orm/supabase_orm.py` — Supabase REST API implementation
- `app/orm/postgres_orm.py` — Direct asyncpg PostgreSQL implementation
- `app/orm/__init__.py` — `get_orm()` factory, `close_orm()` cleanup

## Model Conventions
Every model MUST have:
```python
@staticmethod
def _table() -> str:
    return "table_name"
```

## QueryBuilder Usage
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

## Available QueryBuilder Methods
- `.eq()`, `.neq()` — Equality
- `.gt()`, `.gte()`, `.lt()`, `.lte()` — Comparisons
- `.like()`, `.ilike()` — Pattern matching
- `.is_null()`, `.is_not_null()` — Null checks
- `.in_()` — IN clause
- `.order()` — Sorting
- `.limit()`, `.offset()` — Pagination
- `.range()` — Range queries

## ORM CRUD Methods
- `find_all(model, limit, offset)` — Get all records (MUST support pagination)
- `find_by_id(model, id)` — Get by primary key
- `find_by(model, builder, limit, offset)` — Filtered list
- `find_one_by(model, builder)` — Single result or None
- `create(model, data)` — Insert one
- `create_many(model, data_list)` — Batch insert (MUST use multi-row INSERT)
- `update(model, id, data)` — Update by ID
- `update_by(model, builder, data)` — Update matching (REQUIRES at least one filter)
- `delete(model, id)` — Delete by ID
- `delete_by(model, builder)` — Delete matching (REQUIRES at least one filter)
- `count(model, builder?)` — Total count (MUST support optional filtered counting)
- `execute_raw(query, params)` — Raw SQL (FORBIDDEN in API handlers)

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
- Database connections MUST use TLS/SSL (at minimum `ssl='require'`).
- Supabase service role key MUST NOT be used for read operations. Use anon key for reads.
- `SELECT *` is FORBIDDEN in production — always select specific columns.

### Observability
- EVERY ORM method MUST be decorated with BOTH:
  - `@async_trace("orm.{impl}.{operation}")` — e.g., `@async_trace("orm.postgres.find_by")`
  - `@observe_db("{operation}", "{actual_table_name}")` — NEVER use `"dynamic"` as table name
- Slow queries (>500ms) MUST be logged with full SQL.

### Filtered Count
- `count()` MUST accept an optional `QueryBuilder` parameter for filtered counts.
- Calling `count()` without filters when a filtered count is needed is a BUG.

### Testing
- Tests MUST use a test database or in-memory DB, NOT MockORM for ORM testing.
- MockORM MUST support ALL filter operators, not just `eq`.
