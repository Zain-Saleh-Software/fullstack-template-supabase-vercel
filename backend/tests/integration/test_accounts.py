import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestAccounts:
    async def test_list_accounts(self, client: AsyncClient, auth_headers: dict, mock_orm):
        response = await client.get("/api/v1/accounts/", headers=auth_headers)
        assert response.status_code == 200

    async def test_create_account(self, client: AsyncClient, auth_headers: dict):
        response = await client.post("/api/v1/accounts/", json={"name": "New Corp"}, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["name"] == "New Corp"

    async def test_account_not_found(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/v1/accounts/00000000-0000-0000-0000-000000000000", headers=auth_headers)
        assert response.status_code == 404

    async def test_customer_denied_create(self, client: AsyncClient, customer_auth_headers: dict):
        response = await client.post("/api/v1/accounts/", json={"name": "New Corp"}, headers=customer_auth_headers)
        assert response.status_code == 403
