from typing import Optional
from pydantic import BaseModel


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None


class RoleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_system: bool = False
    created_at: Optional[str] = None


class PermissionResponse(BaseModel):
    id: str
    role_id: str
    action: str
    resource: str
