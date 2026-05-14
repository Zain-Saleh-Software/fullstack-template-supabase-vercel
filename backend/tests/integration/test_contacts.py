import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestContacts:
    async def test_list_contacts(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/v1/contacts/", headers=auth_headers)
        assert response.status_code == 200

    async def test_create_contact(self, client: AsyncClient, auth_headers: dict):
        response = await client.post("/api/v1/contacts/", json={"account_id": "id1", "first_name": "John", "last_name": "Doe"}, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["first_name"] == "John"

    async def test_contact_not_found(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/v1/contacts/00000000-0000-0000-0000-000000000000", headers=auth_headers)
        assert response.status_code == 404

    async def test_customer_denied_create(self, client: AsyncClient, customer_auth_headers: dict):
        response = await client.post("/api/v1/contacts/", json={"account_id": "id1", "first_name": "John", "last_name": "Doe"}, headers=customer_auth_headers)
        assert response.status_code == 403
