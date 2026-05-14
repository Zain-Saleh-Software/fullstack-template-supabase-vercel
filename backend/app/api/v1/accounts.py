from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.core.rbac import PermissionType, rbac
from app.models.user import User
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse
from app.services.account_service import account_service

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("")
async def list_accounts(
    status: Optional[str] = Query(None),
    account_type: Optional[str] = Query(None),
    owner_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(rbac.require_permission(PermissionType.ACCOUNT_READ)),
):
    accounts = await account_service.list_accounts(
        limit=limit, offset=offset, status=status,
        account_type=account_type, owner_id=owner_id,
    )
    total = await account_service.count_accounts()
    return {"data": [a.to_response() for a in accounts], "total": total, "limit": limit, "offset": offset}


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: str,
    current_user: User = Depends(rbac.require_permission(PermissionType.ACCOUNT_READ)),
):
    account = await account_service.get_by_id(account_id)
    if not account:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Account not found")
    return account.to_response()


@router.post("", response_model=AccountResponse)
async def create_account(
    body: AccountCreate,
    current_user: User = Depends(rbac.require_permission(PermissionType.ACCOUNT_CREATE)),
):
    account = await account_service.create(body.model_dump(exclude_none=True))
    return account.to_response()


@router.patch("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: str,
    body: AccountUpdate,
    current_user: User = Depends(rbac.require_permission(PermissionType.ACCOUNT_UPDATE)),
):
    account = await account_service.update(account_id, body.model_dump(exclude_none=True))
    return account.to_response()


@router.delete("/{account_id}")
async def delete_account(
    account_id: str,
    current_user: User = Depends(rbac.require_permission(PermissionType.ACCOUNT_DELETE)),
):
    await account_service.soft_delete(account_id)
    return {"message": "Account deleted"}
