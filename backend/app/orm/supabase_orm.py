import asyncio
import json
from typing import Any, Optional

import asyncpg
import httpx

from app.core.config import settings
from app.core.observability import async_trace, observe_db, logger
from app.orm.base import BaseORM, T
from app.orm.query import QueryBuilder


class SupabaseORM(BaseORM):
    def __init__(self):
        self._base_url = settings.supabase_url
        self._anon_key = settings.supabase_anon_key
        self._service_key = settings.supabase_service_role_key
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            timeout=30.0,
            headers={
                "apikey": self._service_key,
                "Content-Type": "application/json",
            },
        )
        self._raw_pool: Optional[asyncpg.Pool] = None

    def _get_headers(self, use_service_role: bool = False) -> dict:
        return {
            "apikey": self._service_key if use_service_role else self._anon_key,
            "Authorization": f"Bearer {self._service_key if use_service_role else self._anon_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def query(self, model_class: type[T]) -> QueryBuilder:
        return QueryBuilder(model_class._table())  # type: ignore

    @observe_db("select", "supabase")
    @async_trace("orm.supabase.find_all")
    async def find_all(
        self, model_class: type[T], limit: int = 100, offset: int = 0, use_service_role: bool = False
    ) -> list[T]:
        table = model_class._table()  # type: ignore
        headers = self._get_headers(use_service_role)
        headers["Range"] = f"{offset}-{offset + limit - 1}"
        response = await self._client.get(
            f"/rest/v1/{table}",
            headers=headers,
        )
        response.raise_for_status()
        return [model_class(**item) for item in response.json()]

    @observe_db("select", "supabase")
    @async_trace("orm.supabase.find_by_id")
    async def find_by_id(
        self, model_class: type[T], id: str, use_service_role: bool = False
    ) -> Optional[T]:
        table = model_class._table()  # type: ignore
        response = await self._client.get(
            f"/rest/v1/{table}",
            params={"id": f"eq.{id}", "select": "*"},
            headers=self._get_headers(use_service_role),
        )
        response.raise_for_status()
        data = response.json()
        return model_class(**data[0]) if data else None

    @observe_db("select", "supabase")
    @async_trace("orm.supabase.find_by")
    async def find_by(
        self,
        model_class: type[T],
        builder: QueryBuilder,
        limit: int = 100,
        offset: int = 0,
        use_service_role: bool = True,
    ) -> list[T]:
        headers = self._get_headers(use_service_role)
        params = {}
        for op, col, val in builder.filters:
            if op == "eq":
                params[col] = f"eq.{val}"
            elif op == "neq":
                params[col] = f"neq.{val}"
            elif op == "gt":
                params[col] = f"gt.{val}"
            elif op == "gte":
                params[col] = f"gte.{val}"
            elif op == "lt":
                params[col] = f"lt.{val}"
            elif op == "lte":
                params[col] = f"lte.{val}"
            elif op == "like":
                params[col] = f"like.{val}"
            elif op == "ilike":
                params[col] = f"ilike.{val}"
            elif op == "is" and val is None:
                params[col] = "is.null"
            elif op == "is" and val == "not.null":
                params[col] = "is.not.null"
            elif op == "in":
                params[col] = f"in.({','.join(str(v) for v in val)})"

        params["select"] = builder.select_clause

        actual_limit = builder.limit_val or limit
        actual_offset = builder.offset_val or offset
        headers["Range"] = f"{actual_offset}-{actual_offset + actual_limit - 1}"

        if builder.order_by:
            params["order"] = f"{builder.order_by}.{builder.order_direction}"

        response = await self._client.get(
            f"/rest/v1/{builder.table}",
            params=params,
            headers=headers,
        )
        response.raise_for_status()
        return [model_class(**item) for item in response.json()]

    @observe_db("select", "supabase")
    @async_trace("orm.supabase.find_one_by")
    async def find_one_by(
        self,
        model_class: type[T],
        builder: QueryBuilder,
        use_service_role: bool = False,
    ) -> Optional[T]:
        results = await self.find_by(model_class, builder, use_service_role=use_service_role)
        return results[0] if results else None

    @observe_db("insert", "supabase")
    @async_trace("orm.supabase.create")
    async def create(
        self,
        model_class: type[T],
        data: dict[str, Any],
        use_service_role: bool = False,
    ) -> T:
        table = model_class._table()  # type: ignore
        response = await self._client.post(
            f"/rest/v1/{table}",
            headers=self._get_headers(use_service_role),
            content=json.dumps(data),
        )
        response.raise_for_status()
        return model_class(**response.json()[0])

    @observe_db("insert", "supabase")
    @async_trace("orm.supabase.create_many")
    async def create_many(
        self,
        model_class: type[T],
        data_list: list[dict[str, Any]],
        use_service_role: bool = False,
    ) -> list[T]:
        if not data_list:
            return []
        table = model_class._table()  # type: ignore
        response = await self._client.post(
            f"/rest/v1/{table}",
            headers=self._get_headers(use_service_role),
            content=json.dumps(data_list),
        )
        response.raise_for_status()
        return [model_class(**item) for item in response.json()]

    @observe_db("update", "supabase")
    @async_trace("orm.supabase.update")
    async def update(
        self,
        model_class: type[T],
        id: str,
        data: dict[str, Any],
        use_service_role: bool = False,
    ) -> T:
        table = model_class._table()  # type: ignore
        response = await self._client.patch(
            f"/rest/v1/{table}",
            params={"id": f"eq.{id}"},
            headers=self._get_headers(use_service_role),
            content=json.dumps(data),
        )
        response.raise_for_status()
        return model_class(**response.json()[0])

    @observe_db("update", "supabase")
    @async_trace("orm.supabase.update_by")
    async def update_by(
        self,
        model_class: type[T],
        builder: QueryBuilder,
        data: dict[str, Any],
        use_service_role: bool = False,
    ) -> list[T]:
        if not builder.filters:
            raise ValueError("update_by requires at least one filter")
        headers = self._get_headers(use_service_role)
        params = {}
        for op, col, val in builder.filters:
            if op == "eq":
                params[col] = f"eq.{val}"
            elif op == "neq":
                params[col] = f"neq.{val}"
            elif op == "gt":
                params[col] = f"gt.{val}"
            elif op == "gte":
                params[col] = f"gte.{val}"
            elif op == "lt":
                params[col] = f"lt.{val}"
            elif op == "lte":
                params[col] = f"lte.{val}"
            elif op == "like":
                params[col] = f"like.{val}"
            elif op == "ilike":
                params[col] = f"ilike.{val}"
            elif op == "is" and val is None:
                params[col] = "is.null"
            elif op == "is" and val == "not.null":
                params[col] = "is.not.null"
            elif op == "in":
                params[col] = f"in.({','.join(str(v) for v in val)})"
        response = await self._client.patch(
            f"/rest/v1/{builder.table}",
            params=params,
            headers=headers,
            content=json.dumps(data),
        )
        response.raise_for_status()
        return [model_class(**item) for item in response.json()]

    @observe_db("delete", "supabase")
    @async_trace("orm.supabase.delete")
    async def delete(
        self,
        model_class: type[T],
        id: str,
        use_service_role: bool = False,
    ) -> bool:
        table = model_class._table()  # type: ignore
        response = await self._client.delete(
            f"/rest/v1/{table}",
            params={"id": f"eq.{id}"},
            headers=self._get_headers(use_service_role),
        )
        response.raise_for_status()
        content = response.content
        if content and len(content) > 2:
            data = response.json()
            return len(data) > 0
        return False

    @observe_db("delete", "supabase")
    @async_trace("orm.supabase.delete_by")
    async def delete_by(
        self,
        model_class: type[T],
        builder: QueryBuilder,
        use_service_role: bool = False,
    ) -> bool:
        if not builder.filters:
            raise ValueError("delete_by requires at least one filter")
        headers = self._get_headers(use_service_role)
        params = {}
        for op, col, val in builder.filters:
            if op == "eq":
                params[col] = f"eq.{val}"
            elif op == "neq":
                params[col] = f"neq.{val}"
            elif op == "gt":
                params[col] = f"gt.{val}"
            elif op == "gte":
                params[col] = f"gte.{val}"
            elif op == "lt":
                params[col] = f"lt.{val}"
            elif op == "lte":
                params[col] = f"lte.{val}"
            elif op == "like":
                params[col] = f"like.{val}"
            elif op == "ilike":
                params[col] = f"ilike.{val}"
            elif op == "is" and val is None:
                params[col] = "is.null"
            elif op == "is" and val == "not.null":
                params[col] = "is.not.null"
            elif op == "in":
                params[col] = f"in.({','.join(str(v) for v in val)})"
        response = await self._client.delete(
            f"/rest/v1/{builder.table}",
            params=params,
            headers=headers,
        )
        response.raise_for_status()
        content = response.content
        if content and len(content) > 2:
            data = response.json()
            return len(data) > 0
        return False

    @observe_db("count", "supabase")
    @async_trace("orm.supabase.count")
    async def count(
        self,
        model_class: type[T],
        builder: Optional[QueryBuilder] = None,
        use_service_role: bool = True,
    ) -> int:
        table = builder.table if builder else model_class._table()  # type: ignore
        headers = self._get_headers(use_service_role)
        headers["Prefer"] = "count=exact"
        params: dict[str, str] = {"select": "count"}
        if builder:
            for op, col, val in builder.filters:
                if op == "eq":
                    params[col] = f"eq.{val}"
                elif op == "neq":
                    params[col] = f"neq.{val}"
                elif op == "gt":
                    params[col] = f"gt.{val}"
                elif op == "gte":
                    params[col] = f"gte.{val}"
                elif op == "lt":
                    params[col] = f"lt.{val}"
                elif op == "lte":
                    params[col] = f"lte.{val}"
                elif op == "like":
                    params[col] = f"like.{val}"
                elif op == "ilike":
                    params[col] = f"ilike.{val}"
                elif op == "is" and val is None:
                    params[col] = "is.null"
                elif op == "is" and val == "not.null":
                    params[col] = "is.not.null"
                elif op == "in":
                    params[col] = f"in.({','.join(str(v) for v in val)})"
        response = await self._client.get(
            f"/rest/v1/{table}",
            params=params,
            headers=headers,
        )
        response.raise_for_status()
        return int(response.headers.get("content-range", "0-0/0").split("/")[-1])

    @observe_db("raw", "supabase")
    @async_trace("orm.supabase.execute_raw")
    async def execute_raw(
        self, query: str, params: dict[str, Any] | None = None, reason: str = ""
    ) -> list[dict[str, Any]]:
        """Execute raw SQL via direct PostgreSQL connection.
        
        Falls back to SUPABASE_DB_URL for raw SQL (migrations, etc.)
        since Supabase REST API does not support arbitrary SQL queries.
        
        ⚠️ WARNING: Raw SQL execution. Ensure 'reason' documents the need.
        """
        if not reason:
            raise ValueError(
                "execute_raw requires a 'reason' parameter for audit compliance. "
                "Document why raw SQL is necessary."
            )
        if not settings.supabase_db_url:
            raise ValueError(
                "SUPABASE_DB_URL must be set to use execute_raw with Supabase."
            )
        if self._raw_pool is None:
            self._raw_pool = await asyncpg.create_pool(
                dsn=settings.supabase_db_url,
                min_size=1,
                max_size=2,
                command_timeout=30,
                ssl="require",
            )
        async with self._raw_pool.acquire() as conn:
            if params:
                rows = await conn.fetch(query, *params.values())
            else:
                rows = await conn.fetch(query)
            return [dict(row) for row in rows]

    async def close(self):
        await self._client.aclose()
        if self._raw_pool:
            await self._raw_pool.close()
            self._raw_pool = None


supabase_orm = SupabaseORM()
