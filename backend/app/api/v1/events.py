from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.core.rbac import PermissionType, rbac
from app.models.user import User
from app.services.event_service import event_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
async def list_events(
    entity_type: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    actor_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(rbac.require_permission(PermissionType.EVENT_READ)),
):
    events = await event_service.list_events(
        entity_type=entity_type,
        event_type=event_type,
        actor_id=actor_id,
        limit=limit,
        offset=offset,
    )
    total = await event_service.count_events(
        entity_type=entity_type,
        event_type=event_type,
        actor_id=actor_id,
    )
    return {"events": [e.to_response() for e in events], "total": total}
