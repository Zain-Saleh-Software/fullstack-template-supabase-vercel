"""Integration tests for Roles API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestRolesPermissions:
    async def test_list_permissions_authenticated(self, client: AsyncClient, auth_headers: dict, admin_user):
        response = await client.get("/api/v1/roles/permissions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "permissions" in data
        assert data["role"] == "admin"
        assert len(data["permissions"]) > 0

    async def test_list_permissions_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/v1/roles/permissions")
        assert response.status_code == 403

    async def test_check_permission_admin(self, client: AsyncClient, auth_headers: dict):
        response = await client.get(
            "/api/v1/roles/check/user:create",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["has_permission"] is True

    async def test_check_permission_customer_denied(
        self, client: AsyncClient, customer_auth_headers: dict
    ):
        response = await client.get(
            "/api/v1/roles/check/system:admin",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["has_permission"] is False

    async def test_check_permission_customer_allowed(
        self, client: AsyncClient, customer_auth_headers: dict
    ):
        response = await client.get(
            "/api/v1/roles/check/content:read",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["has_permission"] is True

    async def test_my_role_admin(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/v1/roles/my-role", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["role"] == "admin"

    async def test_my_role_customer(self, client: AsyncClient, customer_auth_headers: dict):
        response = await client.get("/api/v1/roles/my-role", headers=customer_auth_headers)
        assert response.status_code == 200
        assert response.json()["role"] == "customer"
