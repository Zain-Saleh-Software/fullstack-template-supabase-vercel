"""Integration tests for Health API endpoint."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestHealthEndpoint:
    async def test_health_returns_ok(self, client: AsyncClient):
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "app" in data
        assert "environment" in data

    async def test_health_has_correct_structure(self, client: AsyncClient):
        response = await client.get("/api/v1/health")
        data = response.json()
        assert set(data.keys()) == {"status", "app", "version", "environment", "database"}
