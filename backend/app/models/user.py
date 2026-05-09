from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class User(BaseModel):
    id: str
    email: str
    hashed_password: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "customer"
    is_active: bool = True
    is_superuser: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @staticmethod
    def _table() -> str:
        return "users"

    def model_dump(self, *args, **kwargs):
        exclude = set(kwargs.get('exclude', set())) | {'hashed_password'}
        kwargs['exclude'] = exclude
        return super().model_dump(*args, **kwargs)

    def to_dict(self) -> dict:
        data = self.model_dump(exclude={"id", "created_at", "updated_at"}, exclude_none=True)
        return data

    def to_response(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
