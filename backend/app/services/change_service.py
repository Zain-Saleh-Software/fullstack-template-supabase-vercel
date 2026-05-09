from datetime import datetime, timezone
from typing import Optional

from app.models.table_change import TableChange
from app.orm import get_orm, QueryBuilder
from app.core.observability import async_trace, logger


class ChangeService:
    @async_trace("change_service.check")
    async def check_changes(self, since: datetime) -> dict:
        orm = get_orm()
        qb = orm.query(TableChange).gte("changed_at", since).order("changed_at", "desc")
        changes = await orm.find_by(TableChange, qb, limit=100)
        tables = list({c.table_name for c in changes})
        logger.info("changes_check", since=since.isoformat(), count=len(changes), tables=tables)
        return {"has_changes": len(changes) > 0, "tables": tables}

    async def cleanup_old(self, days: int = 7) -> None:
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        orm = get_orm()
        qb = orm.query(TableChange).lt("changed_at", cutoff)
        await orm.delete_by(TableChange, qb)
        logger.info("changes_cleanup", cutoff=cutoff.isoformat(), retention_days=days)


change_service = ChangeService()
