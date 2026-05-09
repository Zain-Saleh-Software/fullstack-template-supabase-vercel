"""User factory for creating test user data with various roles and states."""

import uuid
from typing import Optional

from app.core.security import hash_password
from app.models.user import User


class UserFactory:
    """Creates User instances for testing.

    Usage:
        user = UserFactory.build()
        user = UserFactory.build(role="admin")
        user_data = UserFactory.build_dict()
    """

    _counter = 0

    @classmethod
    def _next_email(cls) -> str:
        cls._counter += 1
        return f"user{cls._counter}@test.com"

    @classmethod
    def build(
        cls,
        email: Optional[str] = None,
        password: str = "TestPass123!",
        role: str = "customer",
        full_name: Optional[str] = None,
        is_active: bool = True,
        is_superuser: bool = False,
        **kwargs,
    ) -> User:
        return User(
            id=str(uuid.uuid4()),
            email=email or cls._next_email(),
            hashed_password=hash_password(password),
            full_name=full_name or f"Test User {cls._counter}",
            role=role,
            is_active=is_active,
            is_superuser=is_superuser,
            **kwargs,
        )

    @classmethod
    def build_dict(
        cls,
        email: Optional[str] = None,
        password: str = "TestPass123!",
        role: str = "customer",
        full_name: Optional[str] = None,
        is_active: bool = True,
        **kwargs,
    ) -> dict:
        return {
            "id": str(uuid.uuid4()),
            "email": email or cls._next_email(),
            "hashed_password": hash_password(password),
            "full_name": full_name or f"Test User {cls._counter}",
            "role": role,
            "is_active": is_active,
            **kwargs,
        }

    @classmethod
    def admin(cls) -> User:
        return cls.build(role="admin", is_superuser=True)

    @classmethod
    def technician(cls) -> User:
        return cls.build(role="technician")

    @classmethod
    def member(cls) -> User:
        return cls.build(role="member")

    @classmethod
    def customer(cls) -> User:
        return cls.build(role="customer")

    @classmethod
    def inactive(cls) -> User:
        return cls.build(is_active=False)
