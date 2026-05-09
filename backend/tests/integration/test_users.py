"""Integration tests for Users API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestUsersList:
    async def test_list_users_authenticated(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/v1/users/", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_list_users_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/v1/users/")
        assert response.status_code == 403


@pytest.mark.asyncio
class TestUsersGet:
    async def test_get_user_by_id(self, client: AsyncClient, auth_headers: dict, admin_user):
        response = await client.get(f"/api/v1/users/{admin_user.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["email"] == admin_user.email

    async def test_get_nonexistent_user(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/v1/users/nonexistent-id", headers=auth_headers)
        assert response.status_code == 404


@pytest.mark.asyncio
class TestUsersUpdate:
    async def test_update_user(self, client: AsyncClient, auth_headers: dict, admin_user):
        response = await client.patch(
            f"/api/v1/users/{admin_user.id}",
            headers=auth_headers,
            json={"full_name": "Updated Name"},
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "Updated Name"


@pytest.mark.asyncio
class TestUsersDelete:
    async def test_delete_user(self, client: AsyncClient, auth_headers: dict, admin_user):
        response = await client.delete(
            f"/api/v1/users/{admin_user.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200

    async def test_delete_nonexistent_user(self, client: AsyncClient, auth_headers: dict):
        response = await client.delete(
            "/api/v1/users/nonexistent-id",
            headers=auth_headers,
        )
        assert response.status_code == 404
