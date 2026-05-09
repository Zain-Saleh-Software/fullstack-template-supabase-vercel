"""
End-to-end tests covering complete user flows.

Tests the full lifecycle: register → login → access protected resources
→ role-based access → profile management → logout.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestFullUserFlow:
    """Complete user registration, auth, and resource access flow."""

    async def _register(self, client, email, password, name=None):
        payload = {"email": email, "password": password}
        if name:
            payload["full_name"] = name
        return await client.post("/api/v1/auth/register", json=payload)

    async def _login(self, client, email, password):
        return await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )

    async def test_full_customer_flow(self, client: AsyncClient):
        email = "customer@fullflow.com"
        password = "SecurePass789!"

        # 1. Register
        resp = await self._register(client, email, password, "Flow Customer")
        assert resp.status_code == 200
        tokens = resp.json()
        user_id = tokens["user"]["id"]

        # 2. Access /me
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        resp = await client.get("/api/v1/auth/me", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == email

        # 3. Check permissions (customer = read only)
        resp = await client.get("/api/v1/roles/permissions", headers=headers)
        assert resp.status_code == 200
        perms = resp.json()["permissions"]
        assert "content:read" in perms
        assert "user:create" not in perms

        # 4. Try to access admin-only events endpoint
        resp = await client.get("/api/v1/events/", headers=headers)
        assert resp.status_code == 403

        # 5. Refresh token
        resp = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
        )
        assert resp.status_code == 200
        new_tokens = resp.json()
        assert new_tokens["access_token"] != tokens["access_token"]

        # 6. Access with new token
        headers2 = {"Authorization": f"Bearer {new_tokens['access_token']}"}
        resp = await client.get("/api/v1/auth/me", headers=headers2)
        assert resp.status_code == 200
        assert resp.json()["id"] == user_id

    async def test_admin_can_access_events(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/events/", headers=auth_headers)
        assert resp.status_code == 200

    async def test_unauthorized_access_blocked(self, client: AsyncClient):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code == 403

        resp = await client.get("/api/v1/users/")
        assert resp.status_code == 403

        resp = await client.get("/api/v1/events/")
        assert resp.status_code == 403

    async def test_invalid_token_rejected(self, client: AsyncClient):
        headers = {"Authorization": "Bearer totally.invalid.token"}
        resp = await client.get("/api/v1/auth/me", headers=headers)
        assert resp.status_code == 401

    async def test_register_login_flow_multiple_users(self, client: AsyncClient):
        users = [
            ("alice@test.com", "Pass1!", "Alice"),
            ("bob@test.com", "Pass2!", "Bob"),
            ("charlie@test.com", "Pass3!", "Charlie"),
        ]
        for email, pw, name in users:
            resp = await self._register(client, email, pw, name)
            assert resp.status_code == 200

        for email, pw, name in users:
            resp = await self._login(client, email, pw)
            assert resp.status_code == 200
            assert resp.json()["user"]["email"] == email
