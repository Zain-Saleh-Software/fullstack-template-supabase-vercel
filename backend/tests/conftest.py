"""
Pytest configuration, fixtures, and context for all tests.

Usage:
    pytest tests/ -v --cov=app --cov-report=term-missing
"""

from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.main import app as _app
from app.models.user import User
from app.orm.base import BaseORM
from app.orm.query import QueryBuilder


# ─── Database Context ────────────────────────────────────────────────────

class MockORM(BaseORM):
    """In-memory mock ORM for testing."""

    def __init__(self):
        self._stores: dict[str, dict[str, object]] = {}

    def _store(self, table: str) -> dict[str, object]:
        if table not in self._stores:
            self._stores[table] = {}
        return self._stores[table]

    async def find_all(self, model_class):
        table = model_class._table()
        return list(self._store(table).values())

    async def find_by_id(self, model_class, id):
        table = model_class._table()
        return self._store(table).get(id)

    async def find_by(self, model_class, builder: QueryBuilder):
        table = builder.table
        items = list(self._store(table).values())
        for op, col, val in builder.filters:
            if op == "eq":
                items = [i for i in items if getattr(i, col, None) == val]
        return items

    async def find_one_by(self, model_class, builder: QueryBuilder):
        results = await self.find_by(model_class, builder)
        return results[0] if results else None

    async def create(self, model_class, data: dict):
        table = model_class._table()
        obj = model_class(**data)
        self._store(table)[obj.id] = obj
        return obj

    async def create_many(self, model_class, data_list: list[dict]):
        return [await self.create(model_class, d) for d in data_list]

    async def update(self, model_class, id: str, data: dict):
        table = model_class._table()
        obj = self._store(table).get(id)
        if obj:
            for k, v in data.items():
                setattr(obj, k, v)
        return obj

    async def update_by(self, model_class, builder: QueryBuilder, data: dict):
        items = await self.find_by(model_class, builder)
        for item in items:
            for k, v in data.items():
                setattr(item, k, v)
        return items

    async def delete(self, model_class, id: str) -> bool:
        table = model_class._table()
        return self._store(table).pop(id, None) is not None

    async def delete_by(self, model_class, builder: QueryBuilder) -> bool:
        items = await self.find_by(model_class, builder)
        for item in items:
            await self.delete(model_class, item.id)
        return len(items) > 0

    async def count(self, model_class) -> int:
        table = model_class._table()
        return len(self._store(table))

    async def execute_raw(self, query: str, params=None, reason="") -> list[dict]:
        return []

    async def close(self):
        self._stores.clear()


@pytest.fixture(autouse=True)
def mock_orm():
    """Replace ORM with MockORM for all tests."""
    mock = MockORM()
    with patch("app.orm.get_orm", return_value=mock):
        with patch("app.orm.supabase_orm.supabase_orm", mock):
            with patch("app.services.auth_service.get_orm", return_value=mock):
                yield mock


@pytest.fixture
def app() -> FastAPI:
    return _app


@pytest.fixture
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ─── Auth Context ────────────────────────────────────────────────────────

@pytest.fixture
def user_payload() -> dict:
    return {
        "email": "test@example.com",
        "password": "TestPass123!",
        "full_name": "Test User",
    }


@pytest.fixture
def admin_user(mock_orm, user_payload) -> User:
    import uuid
    from app.core.security import hash_password
    user = User(
        id=str(uuid.uuid4()),
        email="admin@example.com",
        hashed_password=hash_password("AdminPass123!"),
        full_name="Admin User",
        role="admin",
        is_active=True,
        is_superuser=True,
    )
    mock_orm._store("users")[user.id] = user
    return user


@pytest.fixture
def customer_user(mock_orm) -> User:
    import uuid
    from app.core.security import hash_password
    user = User(
        id=str(uuid.uuid4()),
        email="customer@example.com",
        hashed_password=hash_password("CustomerPass123!"),
        full_name="Customer User",
        role="customer",
        is_active=True,
    )
    mock_orm._store("users")[user.id] = user
    return user


@pytest.fixture
def auth_headers(admin_user) -> dict:
    from app.core.security import create_access_token
    token = create_access_token(data={"sub": admin_user.id})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def customer_auth_headers(customer_user) -> dict:
    from app.core.security import create_access_token
    token = create_access_token(data={"sub": customer_user.id})
    return {"Authorization": f"Bearer {token}"}
