from datetime import datetime, timezone
from typing import Optional

from app.core.observability import async_trace, logger
from app.models.contact import Contact
from app.orm import get_orm


class ContactService:
    @async_trace("contact_service.list")
    async def list_contacts(
        self, limit: int = 100, offset: int = 0, account_id: Optional[str] = None,
        owner_id: Optional[str] = None,
    ) -> list[Contact]:
        orm = get_orm()
        builder = orm.query(Contact).eq("is_deleted", False).order("created_at", "desc")
        if account_id:
            builder = builder.eq("account_id", account_id)
        if owner_id:
            builder = builder.eq("owner_id", owner_id)
        return await orm.find_by(Contact, builder, limit=limit, offset=offset)

    @async_trace("contact_service.count")
    async def count_contacts(self, account_id: Optional[str] = None) -> int:
        orm = get_orm()
        builder = orm.query(Contact).eq("is_deleted", False)
        if account_id:
            builder = builder.eq("account_id", account_id)
        return await orm.count(Contact, builder)

    @async_trace("contact_service.get_by_id")
    async def get_by_id(self, contact_id: str) -> Optional[Contact]:
        return await get_orm().find_by_id(Contact, contact_id)

    @async_trace("contact_service.create")
    async def create(self, data: dict) -> Contact:
        contact = await get_orm().create(Contact, data)
        logger.info("contact.created", contact_id=contact.id, account_id=contact.account_id)
        return contact

    @async_trace("contact_service.update")
    async def update(self, contact_id: str, data: dict) -> Contact:
        contact = await get_orm().update(Contact, contact_id, data)
        logger.info("contact.updated", contact_id=contact_id)
        return contact

    @async_trace("contact_service.delete")
    async def soft_delete(self, contact_id: str) -> bool:
        await get_orm().update(Contact, contact_id, {"is_deleted": True, "deleted_at": datetime.now(timezone.utc)})
        logger.info("contact.deleted", contact_id=contact_id)
        return True


contact_service = ContactService()
