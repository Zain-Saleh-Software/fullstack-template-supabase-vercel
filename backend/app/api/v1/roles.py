from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.core.rbac import rbac, PermissionType, RoleType
from app.models.user import User

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("/permissions")
async def list_permissions(current_user: User = Depends(get_current_user)):
    permissions = await rbac.get_user_permissions(current_user)
    return {"permissions": permissions, "role": current_user.role}


@router.get("/check/{permission}")
async def check_permission(
    permission: PermissionType,
    current_user: User = Depends(get_current_user),
):
    has = await rbac.user_has_permission(current_user, permission)
    return {"permission": permission.value, "has_permission": has}


@router.get("/my-role")
async def my_role(current_user: User = Depends(get_current_user)):
    return {
        "role": current_user.role,
        "permissions": await rbac.get_user_permissions(current_user),
    }
