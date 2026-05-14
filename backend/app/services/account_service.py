from datetime import datetime, timezone
from typing import Optional

from app.core.observability import async_trace, logger
from app.models.account import Account
from app.orm import get_orm


class AccountService:
    @async_trace("account_service.list")
    async def list_accounts(
        self, limit: int = 100, offset: int = 0, status: Optional[str] = None,
        account_type: Optional[str] = None, owner_id: Optional[str] = None,
    ) -> list[Account]:
        orm = get_orm()
        builder = orm.query(Account).eq("is_deleted", False).order("created_at", "desc")
        if status:
            builder = builder.eq("status", status)
        if account_type:
            builder = builder.eq("account_type", account_type)
        if owner_id:
            builder = builder.eq("owner_id", owner_id)
        return await orm.find_by(Account, builder, limit=limit, offset=offset)

    @async_trace("account_service.count")
    async def count_accounts(self) -> int:
        orm = get_orm()
        return await orm.count(Account, orm.query(Account).eq("is_deleted", False))

    @async_trace("account_service.get_by_id")
    async def get_by_id(self, account_id: str) -> Optional[Account]:
        return await get_orm().find_by_id(Account, account_id)

    @async_trace("account_service.create")
    async def create(self, data: dict) -> Account:
        account = await get_orm().create(Account, data)
        logger.info("account.created", account_id=account.id, name=account.name)
        return account

    @async_trace("account_service.update")
    async def update(self, account_id: str, data: dict) -> Account:
        account = await get_orm().update(Account, account_id, data)
        logger.info("account.updated", account_id=account_id)
        return account

    @async_trace("account_service.delete")
    async def soft_delete(self, account_id: str) -> bool:
        await get_orm().update(Account, account_id, {"is_deleted": True, "deleted_at": datetime.now(timezone.utc)})
        logger.info("account.deleted", account_id=account_id)
        return True


account_service = AccountService()
