import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.auth_service import auth_service


class MockRequest:
    def __init__(self, email, password, full_name=None):
        self.email = email
        self.password = password
        self.full_name = full_name


@pytest.mark.asyncio
class TestAuthService:
    async def test_register_short_password(self, mock_orm):
        request = MockRequest(email="test@test.com", password="123")
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            await auth_service.register(request)
        assert exc.value.status_code == 422

    async def test_register_success(self, mock_orm):
        request = MockRequest(email="new@test.com", password="V3ryStr0ngP@ssw0rd!", full_name="New User")
        result = await auth_service.register(request)
        assert "access_token" in result
        assert "refresh_token" in result
        assert result["user"]["email"] == "new@test.com"

    async def test_login_user_not_found(self, mock_orm):
        request = MockRequest(email="nonexist@test.com", password="Pass1234!")
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            await auth_service.login(request)
        assert exc.value.status_code == 401

    async def test_login_success(self, mock_orm, user_payload):
        await auth_service.register(MockRequest(**user_payload))
        request = MockRequest(email=user_payload["email"], password=user_payload["password"])
        result = await auth_service.login(request)
        assert "access_token" in result
