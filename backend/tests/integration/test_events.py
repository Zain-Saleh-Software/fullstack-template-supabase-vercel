"""Integration tests for Events API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestEventsList:
    async def test_list_events_admin(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/v1/events/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert "total" in data

    async def test_list_events_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/v1/events/")
        assert response.status_code == 403

    async def test_list_events_customer_denied(
        self, client: AsyncClient, customer_auth_headers: dict
    ):
        response = await client.get("/api/v1/events/", headers=customer_auth_headers)
        assert response.status_code == 403

    async def test_list_events_with_filters(self, client: AsyncClient, auth_headers: dict):
        response = await client.get(
            "/api/v1/events/?entity_type=user&limit=5",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert isinstance(response.json()["events"], list)
