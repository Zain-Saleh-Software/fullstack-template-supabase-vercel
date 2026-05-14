from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies import get_current_user
from app.core.rbac import PermissionType, rbac
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse
from app.services.contact_service import contact_service

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("")
async def list_contacts(
    account_id: Optional[str] = Query(None),
    owner_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(rbac.require_permission(PermissionType.CONTACT_READ)),
):
    contacts = await contact_service.list_contacts(
        limit=limit, offset=offset, account_id=account_id,
        owner_id=owner_id,
    )
    total = await contact_service.count_contacts(account_id=account_id)
    return {"data": [c.to_response() for c in contacts], "total": total, "limit": limit, "offset": offset}


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: str,
    current_user: User = Depends(rbac.require_permission(PermissionType.CONTACT_READ)),
):
    contact = await contact_service.get_by_id(contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact.to_response()


@router.post("", response_model=ContactResponse)
async def create_contact(
    body: ContactCreate,
    current_user: User = Depends(rbac.require_permission(PermissionType.CONTACT_CREATE)),
):
    contact = await contact_service.create(body.model_dump(exclude_none=True))
    return contact.to_response()


@router.patch("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    body: ContactUpdate,
    current_user: User = Depends(rbac.require_permission(PermissionType.CONTACT_UPDATE)),
):
    contact = await contact_service.update(contact_id, body.model_dump(exclude_none=True))
    return contact.to_response()


@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: str,
    current_user: User = Depends(rbac.require_permission(PermissionType.CONTACT_DELETE)),
):
    await contact_service.soft_delete(contact_id)
    return {"message": "Contact deleted"}
