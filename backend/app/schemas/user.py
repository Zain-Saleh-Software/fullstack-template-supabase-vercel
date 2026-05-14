from typing import Optional, Any
from pydantic import BaseModel, field_validator
from datetime import datetime


class UserCreate(BaseModel):
    model_config = {"coerce_numbers_to_str": True}

    email: str
    password: str
    full_name: Optional[str] = None

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: Any) -> Optional[str]:
        """Ensure full_name is converted to string if not None"""
        if v is None:
            return None
        if isinstance(v, bool):
            raise ValueError('Full name cannot be a boolean')
        return str(v).strip()


class UserUpdate(BaseModel):
    model_config = {"coerce_numbers_to_str": True}

    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: Any) -> Optional[str]:
        """Ensure full_name is converted to string if not None"""
        if v is None:
            return None
        if isinstance(v, bool):
            raise ValueError('Full name cannot be a boolean')
        return str(v).strip()


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "customer"
    is_active: bool
    created_at: Optional[datetime] = None


