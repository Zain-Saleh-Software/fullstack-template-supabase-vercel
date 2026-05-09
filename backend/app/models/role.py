from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class Role(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_system: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @staticmethod
    def _table() -> str:
        return "roles"

    def to_response(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "is_system": self.is_system,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Permission(BaseModel):
    id: str
    role_id: str
    action: str
    resource: str
    created_at: Optional[datetime] = None

    @staticmethod
    def _table() -> str:
        return "permissions"

    @property
    def full_code(self) -> str:
        return f"{self.resource}:{self.action}"
