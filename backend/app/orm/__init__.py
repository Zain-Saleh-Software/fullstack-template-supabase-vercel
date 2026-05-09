from typing import Optional

from app.core.config import settings
from app.orm.base import BaseORM
from app.orm.query import QueryBuilder

_orm_instance: Optional[BaseORM] = None


def get_orm() -> BaseORM:
    global _orm_instance
    if _orm_instance is None:
        if settings.db_type == "postgres":
            from app.orm.postgres_orm import PostgresORM
            _orm_instance = PostgresORM()
        elif settings.db_type == "supabase":
            from app.orm.supabase_orm import SupabaseORM
            _orm_instance = SupabaseORM()
        else:
            raise ValueError(f"Unsupported db_type: {settings.db_type}")
    return _orm_instance


async def close_orm():
    global _orm_instance
    if _orm_instance:
        await _orm_instance.close()
        _orm_instance = None


__all__ = ["get_orm", "close_orm", "BaseORM", "QueryBuilder"]
