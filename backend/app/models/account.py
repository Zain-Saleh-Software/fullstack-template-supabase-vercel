from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class Account(BaseModel):
    id: str
    name: str
    account_type: str = "customer"
    status: str = "active"
    owner_id: Optional[str] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @staticmethod
    def _table() -> str:
        return "accounts"

    def to_dict(self) -> dict:
        return self.model_dump(exclude={"id", "created_at", "updated_at"}, exclude_none=True)

    def to_response(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "account_type": self.account_type,
            "status": self.status,
            "owner_id": self.owner_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
