from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class AccountCreate(BaseModel):
    name: str
    account_type: str = "customer"
    status: str = "active"
    owner_id: Optional[str] = None


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[str] = None


class AccountResponse(BaseModel):
    id: str
    name: str
    account_type: str
    status: str
    owner_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
