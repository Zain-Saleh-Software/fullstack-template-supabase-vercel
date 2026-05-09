from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import get_current_user
from app.core.rbac import rbac, PermissionType
from app.models.user import User
from app.orm import get_orm
from app.schemas.user import UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserResponse])
async def list_users(
    limit: int = Query(100, ge=1, le=1000),
    cursor: Optional[str] = Query(None, description="Keyset pagination cursor (user id)"),
    offset: int = Query(0, ge=0, deprecated=True, description="Use cursor instead for better performance"),
    current_user: User = Depends(get_current_user),
    _=Depends(rbac.require_permission(PermissionType.USER_READ)),
):
    orm = get_orm()
    if cursor is not None:
        users = await orm.find_all_keyset(User, cursor_id=cursor, limit=limit)
    else:
        users = await orm.find_all(User, limit=limit, offset=offset)
    return [u.to_response() for u in users]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    _=Depends(rbac.require_permission(PermissionType.USER_READ)),
):
    user = await get_orm().find_by_id(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user.to_response()


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    _=Depends(rbac.require_permission(PermissionType.USER_UPDATE)),
):
    existing = await get_orm().find_by_id(User, user_id)
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user = await get_orm().update(User, user_id, data.model_dump(exclude_none=True))
    return user.to_response()


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    _=Depends(rbac.require_permission(PermissionType.USER_DELETE)),
):
    existing = await get_orm().find_by_id(User, user_id)
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    await get_orm().delete(User, user_id)
    return {"message": "User deleted"}
