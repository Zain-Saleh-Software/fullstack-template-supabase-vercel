from enum import Enum
from typing import Optional

from fastapi import Depends, HTTPException, status

from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.role import Role, Permission


class RoleType(str, Enum):
    ADMIN = "admin"
    TECHNICIAN = "technician"
    MEMBER = "member"
    CUSTOMER = "customer"


class PermissionType(str, Enum):
    # User management
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"

    # Role management
    ROLE_CREATE = "role:create"
    ROLE_READ = "role:read"
    ROLE_UPDATE = "role:update"
    ROLE_DELETE = "role:delete"

    # Content management
    CONTENT_CREATE = "content:create"
    CONTENT_READ = "content:read"
    CONTENT_UPDATE = "content:update"
    CONTENT_DELETE = "content:delete"

    # System
    SYSTEM_READ = "system:read"
    SYSTEM_ADMIN = "system:admin"

    # Events
    EVENT_READ = "event:read"
    EVENT_EXPORT = "event:export"


# ─── Default Role-Permission Mapping ─────────────────────────────────────
ROLE_PERMISSIONS: dict[RoleType, list[PermissionType]] = {
    RoleType.ADMIN: list(PermissionType),
    RoleType.TECHNICIAN: [
        PermissionType.USER_READ,
        PermissionType.CONTENT_CREATE,
        PermissionType.CONTENT_READ,
        PermissionType.CONTENT_UPDATE,
        PermissionType.SYSTEM_READ,
        PermissionType.EVENT_READ,
    ],
    RoleType.MEMBER: [
        PermissionType.CONTENT_READ,
        PermissionType.CONTENT_CREATE,
        PermissionType.CONTENT_UPDATE,
    ],
    RoleType.CUSTOMER: [
        PermissionType.CONTENT_READ,
    ],
}


class RBACService:
    async def get_user_permissions(self, user: User) -> list[str]:
        from app.orm import get_orm
        from app.orm.query import QueryBuilder
        
        orm = get_orm()
        role_record = await orm.find_one_by(
            Role, 
            QueryBuilder("roles").eq("name", user.role or RoleType.CUSTOMER.value)
        )
        if not role_record:
            return []
            
        permissions = await orm.find_by(
            Permission, 
            QueryBuilder("permissions").eq("role_id", role_record.id)
        )
        
        # fallback to in-memory map if DB is empty to prevent complete lockout
        if not permissions and user.role == RoleType.ADMIN.value:
            return [p.value for p in ROLE_PERMISSIONS[RoleType.ADMIN]]
            
        return [p.full_code for p in permissions]

    async def user_has_permission(self, user: User, permission: PermissionType) -> bool:
        permissions = await self.get_user_permissions(user)
        return permission.value in permissions

    async def user_has_role(self, user: User, role: RoleType) -> bool:
        return user.role == role.value or user.role == RoleType.ADMIN.value

    def require_permission(self, permission: PermissionType):
        async def _check(current_user: User = Depends(get_current_user)):
            if not await self.user_has_permission(current_user, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permission: {permission.value}",
                )
            return current_user
        return _check

    def require_role(self, role: RoleType):
        async def _check(current_user: User = Depends(get_current_user)):
            if not await self.user_has_role(current_user, role):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Required role: {role.value}",
                )
            return current_user
        return _check


rbac = RBACService()
