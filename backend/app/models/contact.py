from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class Contact(BaseModel):
    model_config = {"coerce_numbers_to_str": True}

    id: str
    account_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    mobile_phone_2: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    is_primary: bool = False
    owner_id: Optional[str] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @staticmethod
    def _table() -> str:
        return "contacts"

    def to_dict(self) -> dict:
        return self.model_dump(exclude={"id", "created_at", "updated_at"}, exclude_none=True)

    def to_response(self) -> dict:
        return {
            "id": self.id,
            "account_id": self.account_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "mobile_phone": self.mobile_phone,
            "mobile_phone_2": self.mobile_phone_2,
            "job_title": self.job_title,
            "department": self.department,
            "is_primary": self.is_primary,
            "owner_id": self.owner_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
