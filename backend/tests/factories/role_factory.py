"""Role factory for creating test role data."""

import uuid
from typing import Optional

from app.models.role import Role, Permission


class RoleFactory:
    _counter = 0

    @classmethod
    def build(
        cls,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_system: bool = False,
    ) -> Role:
        cls._counter += 1
        return Role(
            id=str(uuid.uuid4()),
            name=name or f"role_{cls._counter}",
            description=description or f"Test role {cls._counter}",
            is_system=is_system,
        )

    @classmethod
    def admin(cls) -> Role:
        return cls.build(name="admin", description="Administrator", is_system=True)

    @classmethod
    def technician(cls) -> Role:
        return cls.build(name="technician", description="Technician", is_system=True)

    @classmethod
    def member(cls) -> Role:
        return cls.build(name="member", description="Member", is_system=True)

    @classmethod
    def customer(cls) -> Role:
        return cls.build(name="customer", description="Customer", is_system=True)

    @staticmethod
    def build_permission(role_id: str, action: str = "read", resource: str = "content") -> Permission:
        return Permission(
            id=str(uuid.uuid4()),
            role_id=role_id,
            action=action,
            resource=resource,
        )
