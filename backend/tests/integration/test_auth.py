"""Integration tests for Auth API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestAuthRegister:
    async def test_register_success(self, client: AsyncClient, user_payload: dict):
        response = await client.post("/api/v1/auth/register", json=user_payload)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == user_payload["email"]

    async def test_register_duplicate_email(
        self, client: AsyncClient, user_payload: dict
    ):
        await client.post("/api/v1/auth/register", json=user_payload)
        response = await client.post("/api/v1/auth/register", json=user_payload)
        assert response.status_code == 409
        assert "already registered" in response.json()["detail"].lower()

    async def test_register_invalid_email(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": "invalid", "password": "TestPass123!"},
        )
        assert response.status_code == 422


@pytest.mark.asyncio
class TestAuthLogin:
    async def test_login_success(self, client: AsyncClient, user_payload: dict):
        await client.post("/api/v1/auth/register", json=user_payload)
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": user_payload["email"],
                "password": user_payload["password"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == user_payload["email"]

    async def test_login_wrong_password(self, client: AsyncClient, user_payload: dict):
        await client.post("/api/v1/auth/register", json=user_payload)
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": user_payload["email"], "password": "wrong"},
        )
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@test.com", "password": "TestPass123!"},
        )
        assert response.status_code == 401


@pytest.mark.asyncio
class TestAuthMe:
    async def test_me_authenticated(self, client: AsyncClient, user_payload: dict, auth_headers: dict):
        await client.post("/api/v1/auth/register", json=user_payload)
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        assert "email" in response.json()

    async def test_me_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 403

    async def test_me_invalid_token(self, client: AsyncClient):
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401


@pytest.mark.asyncio
class TestAuthRefresh:
    async def test_refresh_success(self, client: AsyncClient, user_payload: dict):
        register_resp = await client.post("/api/v1/auth/register", json=user_payload)
        refresh_token = register_resp.json()["refresh_token"]

        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    async def test_refresh_invalid_token(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid"},
        )
        assert response.status_code == 401
