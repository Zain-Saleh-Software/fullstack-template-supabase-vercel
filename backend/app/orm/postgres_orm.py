import asyncio
import json
import uuid
from datetime import date, datetime
from typing import Any, Optional

import asyncpg

from app.core.config import settings
from app.orm.base import BaseORM, T
from app.orm.query import QueryBuilder
from app.core.observability import async_trace, observe_db, logger

VALID_COLUMNS: dict[str, set[str]] = {
    "users": {"id", "email", "hashed_password", "full_name", "avatar_url", "role", "is_active", "is_superuser", "created_at", "updated_at"},
    "events": {"id", "event_type", "entity_type", "entity_id", "actor_id", "metadata", "severity", "created_at"},
    "roles": {"id", "name", "description", "is_system", "created_at", "updated_at"},
    "permissions": {"id", "role_id", "action", "resource", "created_at"},
    "table_changes": {"id", "table_name", "operation", "changed_at"},
    "accounts": {"id", "name", "account_type", "status", "owner_id", "is_deleted", "deleted_at", "created_at", "updated_at"},
    "contacts": {"id", "account_id", "first_name", "last_name", "email", "phone", "job_title", "is_primary", "owner_id", "is_deleted", "deleted_at", "created_at", "updated_at"},
    "password_reset_tokens": {"id", "user_id", "hashed_token", "expires_at", "used_at", "created_at"},
}


def validate_columns(table: str, cols: list[str]) -> None:
    known = VALID_COLUMNS.get(table)
    if known is None:
        return
    for col in cols:
        if col not in known:
            raise ValueError(f"Unknown column '{col}' for table '{table}'")


def validate_builder_filters(table: str, filters: list[tuple[str, str, object]]) -> None:
    known = VALID_COLUMNS.get(table)
    if known is None:
        return
    for _, col, _ in filters:
        if col not in known:
            raise ValueError(f"Unknown column '{col}' for table '{table}'")


_DATE_FMT = "%Y-%m-%d"
_DATETIME_FMT = "%Y-%m-%dT%H:%M:%S"


def _convert_val(v: Any) -> Any:
    if isinstance(v, str):
        if v == "":
            return None
        if len(v) == 10 and v[4] == "-" and v[7] == "-":
            try:
                return datetime.strptime(v, _DATE_FMT).date()
            except ValueError:
                pass
        if len(v) >= 19 and v[10] == "T":
            try:
                return datetime.strptime(v[:19], _DATETIME_FMT)
            except ValueError:
                pass
        return v
    if isinstance(v, (dict, list)):
        return json.dumps(v)
    return v


class PostgresORM(BaseORM):
    def __init__(self):
        self._pool: Optional[asyncpg.Pool] = None

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            min_size = max(settings.db_pool_min_size, 2)
            max_size = max(min_size, min(settings.db_pool_max_size, settings.backend_workers * 4))
            last_exception = None
            backoff = 1
            for attempt in range(5):
                try:
                    self._pool = await asyncpg.create_pool(
                        dsn=settings.database_url,
                        min_size=min_size,
                        max_size=max_size,
                        command_timeout=30,
                        ssl=settings.db_ssl if settings.db_ssl != "disable" else None,
                    )
                    return self._pool
                except Exception as e:
                    last_exception = e
                    logger.warning("db_pool_retry", attempt=attempt + 1, backoff=backoff, error=str(e))
                    await asyncio.sleep(backoff)
                    backoff = min(backoff * 2, 30)
            raise last_exception or RuntimeError("Failed to create database pool")
        return self._pool

    @staticmethod
    def _convert_row(row: asyncpg.Record) -> dict:
        data = dict(row)
        for key, value in data.items():
            if isinstance(value, uuid.UUID):
                data[key] = str(value)
            elif isinstance(value, str):
                try:
                    data[key] = json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    pass
            elif isinstance(value, (date, datetime)):
                data[key] = value.isoformat()
            elif isinstance(value, int):
                data[key] = str(value)
        return data

    async def _row_to_model(self, model_class: type[T], row: Optional[asyncpg.Record]) -> Optional[T]:
        if row is None:
            return None
        return model_class(**self._convert_row(row))

    async def _rows_to_models(self, model_class: type[T], rows: list[asyncpg.Record]) -> list[T]:
        return [model_class(**self._convert_row(row)) for row in rows]

    @observe_db("select", "dynamic")
    @async_trace("orm.postgres.find_all")
    async def find_all(self, model_class: type[T], limit: int = 100, offset: int = 0) -> list[T]:
        pool = await self._get_pool()
        table = model_class._table()
        async with pool.acquire() as conn:
            rows = await conn.fetch(f'SELECT * FROM "{table}" LIMIT $1 OFFSET $2', limit, offset)
            return await self._rows_to_models(model_class, rows)

    @observe_db("select", "dynamic")
    @async_trace("orm.postgres.find_all_keyset")
    async def find_all_keyset(self, model_class: type[T], cursor_id: Optional[str] = None, limit: int = 100) -> list[T]:
        """Keyset pagination using id column. More efficient than OFFSET for large tables."""
        pool = await self._get_pool()
        table = model_class._table()
        async with pool.acquire() as conn:
            if cursor_id:
                rows = await conn.fetch(
                    f'SELECT * FROM "{table}" WHERE id > $1 ORDER BY id ASC LIMIT $2',
                    cursor_id, limit,
                )
            else:
                rows = await conn.fetch(
                    f'SELECT * FROM "{table}" ORDER BY id ASC LIMIT $1',
                    limit,
                )
            return await self._rows_to_models(model_class, rows)

    @observe_db("select", "dynamic")
    @async_trace("orm.postgres.find_by_id")
    async def find_by_id(self, model_class: type[T], id: str) -> Optional[T]:
        pool = await self._get_pool()
        table = model_class._table()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(f'SELECT * FROM "{table}" WHERE id = $1', id)
            return await self._row_to_model(model_class, row)

    @observe_db("select", "dynamic")
    @async_trace("orm.postgres.find_by")
    async def find_by(self, model_class: type[T], builder: QueryBuilder, limit: int = 100, offset: int = 0) -> list[T]:
        pool = await self._get_pool()
        table = builder.table
        validate_builder_filters(table, builder.filters)
        query = f'SELECT {builder.select_clause} FROM "{table}"'
        conditions = []
        values = []
        param_idx = 1

        for op, col, val in builder.filters:
            if op == "eq":
                conditions.append(f'"{col}" = ${param_idx}')
                values.append(val)
            elif op == "neq":
                conditions.append(f'"{col}" != ${param_idx}')
                values.append(val)
            elif op == "gt":
                conditions.append(f'"{col}" > ${param_idx}')
                values.append(val)
            elif op == "gte":
                conditions.append(f'"{col}" >= ${param_idx}')
                values.append(val)
            elif op == "lt":
                conditions.append(f'"{col}" < ${param_idx}')
                values.append(val)
            elif op == "lte":
                conditions.append(f'"{col}" <= ${param_idx}')
                values.append(val)
            elif op == "like":
                conditions.append(f'"{col}" LIKE ${param_idx}')
                values.append(val)
            elif op == "ilike":
                conditions.append(f'"{col}" ILIKE ${param_idx}')
                values.append(val)
            elif op == "is" and val is None:
                conditions.append(f'"{col}" IS NULL')
            elif op == "is" and val == "not.null":
                conditions.append(f'"{col}" IS NOT NULL')
            elif op == "in":
                placeholders = ', '.join([f'${param_idx + i}' for i in range(len(val))])
                conditions.append(f'"{col}" IN ({placeholders})')
                values.extend(val)
                param_idx += len(val) - 1
            param_idx += 1

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        if builder.order_by:
            query += f' ORDER BY "{builder.order_by}" {builder.order_direction}'

        limit = builder.limit_val or limit
        offset = builder.offset_val or offset
        query += f" LIMIT ${param_idx} OFFSET ${param_idx + 1}"

        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *values, limit, offset)
            return await self._rows_to_models(model_class, rows)

    @observe_db("select", "dynamic")
    @async_trace("orm.postgres.find_one_by")
    async def find_one_by(self, model_class: type[T], builder: QueryBuilder) -> Optional[T]:
        results = await self.find_by(model_class, builder)
        return results[0] if results else None

    @observe_db("insert", "dynamic")
    @async_trace("orm.postgres.create")
    async def create(self, model_class: type[T], data: dict[str, Any]) -> T:
        pool = await self._get_pool()
        table = model_class._table()
        columns = list(data.keys())
        validate_columns(table, columns)
        values = [_convert_val(v) for v in data.values()]
        placeholders = ', '.join([f'${i+1}' for i in range(len(values))])
        columns_str = ', '.join([f'"{c}"' for c in columns])

        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                f'INSERT INTO "{table}" ({columns_str}) VALUES ({placeholders}) RETURNING *',
                *values,
            )
            return await self._row_to_model(model_class, row)

    @observe_db("insert", "dynamic")
    @async_trace("orm.postgres.create_many")
    async def create_many(self, model_class: type[T], data_list: list[dict[str, Any]]) -> list[T]:
        pool = await self._get_pool()
        table = model_class._table()
        if not data_list:
            return []
        columns = list(data_list[0].keys())
        validate_columns(table, columns)
        columns_str = ', '.join([f'"{c}"' for c in columns])

        all_values = []
        placeholders_list = []
        idx = 1
        for data in data_list:
            vals = [_convert_val(data[c]) for c in columns]
            all_values.extend(vals)
            ph = ', '.join([f'${idx + i}' for i in range(len(vals))])
            placeholders_list.append(f'({ph})')
            idx += len(vals)

        multi_values = ', '.join(placeholders_list)
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                f'INSERT INTO "{table}" ({columns_str}) VALUES {multi_values} RETURNING *',
                *all_values,
            )
            return await self._rows_to_models(model_class, rows)

    @observe_db("update", "dynamic")
    @async_trace("orm.postgres.update")
    async def update(self, model_class: type[T], id: str, data: dict[str, Any]) -> T:
        pool = await self._get_pool()
        table = model_class._table()
        validate_columns(table, list(data.keys()))
        values = [_convert_val(v) for v in data.values()]
        set_clause = ', '.join([f'"{k}" = ${i+1}' for i, k in enumerate(data.keys())])
        values.append(id)

        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                f'UPDATE "{table}" SET {set_clause} WHERE id = ${len(values)} RETURNING *',
                *values,
            )
            return await self._row_to_model(model_class, row)

    @observe_db("update", "dynamic")
    @async_trace("orm.postgres.update_by")
    async def update_by(self, model_class: type[T], builder: QueryBuilder, data: dict[str, Any]) -> list[T]:
        if not builder.filters:
            raise ValueError("update_by requires at least one filter")
        pool = await self._get_pool()
        table = builder.table
        validate_columns(table, list(data.keys()))
        validate_builder_filters(table, builder.filters)
        values = [_convert_val(v) for v in data.values()]
        set_clause = ', '.join([f'"{k}" = ${i+1}' for i, k in enumerate(data.keys())])
        conditions = []
        param_idx = len(values) + 1

        for op, col, val in builder.filters:
            if op == "eq":
                conditions.append(f'"{col}" = ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "neq":
                conditions.append(f'"{col}" != ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "gt":
                conditions.append(f'"{col}" > ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "gte":
                conditions.append(f'"{col}" >= ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "lt":
                conditions.append(f'"{col}" < ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "lte":
                conditions.append(f'"{col}" <= ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "like":
                conditions.append(f'"{col}" LIKE ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "ilike":
                conditions.append(f'"{col}" ILIKE ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "is" and val is None:
                conditions.append(f'"{col}" IS NULL')
            elif op == "is" and val == "not.null":
                conditions.append(f'"{col}" IS NOT NULL')
            elif op == "in":
                placeholders = ', '.join([f'${param_idx + i}' for i in range(len(val))])
                conditions.append(f'"{col}" IN ({placeholders})')
                values.extend(val)
                param_idx += len(val)

        where_clause = " AND ".join(conditions) if conditions else "TRUE"
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                f'UPDATE "{table}" SET {set_clause} WHERE {where_clause} RETURNING *',
                *values,
            )
            return await self._rows_to_models(model_class, rows)

    @observe_db("delete", "dynamic")
    @async_trace("orm.postgres.delete")
    async def delete(self, model_class: type[T], id: str) -> bool:
        pool = await self._get_pool()
        table = model_class._table()
        async with pool.acquire() as conn:
            result = await conn.execute(f'DELETE FROM "{table}" WHERE id = $1', id)
            return "DELETE 1" in result

    @observe_db("delete", "dynamic")
    @async_trace("orm.postgres.delete_by")
    async def delete_by(self, model_class: type[T], builder: QueryBuilder) -> bool:
        if not builder.filters:
            raise ValueError("delete_by requires at least one filter")
        pool = await self._get_pool()
        table = builder.table
        validate_builder_filters(table, builder.filters)
        conditions = []
        values = []
        param_idx = 1

        for op, col, val in builder.filters:
            if op == "eq":
                conditions.append(f'"{col}" = ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "neq":
                conditions.append(f'"{col}" != ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "gt":
                conditions.append(f'"{col}" > ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "gte":
                conditions.append(f'"{col}" >= ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "lt":
                conditions.append(f'"{col}" < ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "lte":
                conditions.append(f'"{col}" <= ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "like":
                conditions.append(f'"{col}" LIKE ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "ilike":
                conditions.append(f'"{col}" ILIKE ${param_idx}')
                values.append(val)
                param_idx += 1
            elif op == "is" and val is None:
                conditions.append(f'"{col}" IS NULL')
            elif op == "is" and val == "not.null":
                conditions.append(f'"{col}" IS NOT NULL')
            elif op == "in":
                placeholders = ', '.join([f'${param_idx + i}' for i in range(len(val))])
                conditions.append(f'"{col}" IN ({placeholders})')
                values.extend(val)
                param_idx += len(val)

        where_clause = " AND ".join(conditions) if conditions else "TRUE"
        async with pool.acquire() as conn:
            result = await conn.execute(f'DELETE FROM "{table}" WHERE {where_clause}', *values)
            return int(result.split()[-1]) > 0

    @observe_db("count", "dynamic")
    @async_trace("orm.postgres.count")
    async def count(self, model_class: type[T], builder: Optional[QueryBuilder] = None) -> int:
        pool = await self._get_pool()
        table = builder.table if builder else model_class._table()
        query = f'SELECT COUNT(*) FROM "{table}"'
        values = []
        if builder and builder.filters:
            validate_builder_filters(table, builder.filters)
            conditions = []
            param_idx = 1
            for op, col, val in builder.filters:
                if op == "eq":
                    conditions.append(f'"{col}" = ${param_idx}')
                    values.append(val)
                elif op == "neq":
                    conditions.append(f'"{col}" != ${param_idx}')
                    values.append(val)
                elif op == "gt":
                    conditions.append(f'"{col}" > ${param_idx}')
                    values.append(val)
                elif op == "gte":
                    conditions.append(f'"{col}" >= ${param_idx}')
                    values.append(val)
                elif op == "lt":
                    conditions.append(f'"{col}" < ${param_idx}')
                    values.append(val)
                elif op == "lte":
                    conditions.append(f'"{col}" <= ${param_idx}')
                    values.append(val)
                elif op == "like":
                    conditions.append(f'"{col}" LIKE ${param_idx}')
                    values.append(val)
                elif op == "ilike":
                    conditions.append(f'"{col}" ILIKE ${param_idx}')
                    values.append(val)
                elif op == "is" and val is None:
                    conditions.append(f'"{col}" IS NULL')
                elif op == "is" and val == "not.null":
                    conditions.append(f'"{col}" IS NOT NULL')
                elif op == "in":
                    placeholders = ', '.join([f'${param_idx + i}' for i in range(len(val))])
                    conditions.append(f'"{col}" IN ({placeholders})')
                    values.extend(val)
                    param_idx += len(val) - 1
                param_idx += 1
            query += " WHERE " + " AND ".join(conditions)
        async with pool.acquire() as conn:
            row = await conn.fetchval(query, *values)
            return row or 0

    @observe_db("raw", "dynamic")
    @async_trace("orm.postgres.execute_raw")
    async def execute_raw(self, query: str, params: Optional[dict] = None, reason: str = "") -> list[dict]:
        """⚠️ WARNING: Raw SQL execution — susceptible to SQL injection. Use with extreme caution.
        Args:
            query: Raw SQL query string.
            params: Optional query parameters.
            reason: Mandatory audit trail — must reference a JIRA/issue number explaining why raw SQL is needed.
        """
        if not reason:
            raise ValueError("execute_raw requires a 'reason' parameter for audit compliance. "
                             "Document why raw SQL is necessary (e.g. 'migration: add column foo').")
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            if params:
                if isinstance(params, dict):
                    rows = await conn.fetch(query, *params.values())
                else:
                    rows = await conn.fetch(query, *params)
            else:
                rows = await conn.fetch(query)
            return [dict(row) for row in rows]

    @observe_db("script", "dynamic")
    @async_trace("orm.postgres.execute_script")
    async def execute_script(self, script: str, reason: str = "") -> str:
        """Execute a multi-command SQL script.
        Args:
            script: SQL script containing multiple statements.
            reason: Mandatory audit trail.
        """
        if not reason:
            raise ValueError("execute_script requires a 'reason' parameter for audit compliance.")
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            return await conn.execute(script)

    async def close(self):
        if self._pool:
            await self._pool.close()
            self._pool = None
