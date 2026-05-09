"""
Event Service — BUSINESS EVENTS ONLY (added ON TOP of logs/traces/metrics).

Logs + Traces + Metrics are NON-NEGOTIABLE for every operation.
This service only exists for data that ALSO needs the events table.

BOUNDARY RULE — Before calling record(), ask:
  "Does the end-user or the business need to see this record in a year?"
  If NO → logs/traces/metrics only, DO NOT call this service.
  If YES → this service + logs + traces + metrics (all four).

GOOD candidates (yes to Golden Question):
  - User registration / account deletion
  - Subscription changes / payments
  - Order placement / refunds
  - Role changes / admin actions
  - Data export requests

BAD candidates (no to Golden Question — logs only):
  - Every login/logout
  - API request/response cycles
  - Function execution times
  - Non-critical flow checkpoints
  - Error stack traces
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from app.models.event import Event
from app.orm import get_orm
from app.core.observability import logger, async_trace


class EventService:
    @async_trace("event_service.record")
    async def record(
        self,
        event_type: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
        severity: str = "info",
    ) -> Event:
        # TODO: For high-throughput scenarios, replace with background task queue
        # (Celery, ARQ, or Dramatiq) to avoid blocking the request-response cycle.
        # Current sync approach is fine for MVP/low-traffic deployments.
        orm = get_orm()
        event_data = {
            "id": str(uuid.uuid4()),
            "event_type": event_type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "actor_id": actor_id,
            "metadata": metadata or {},
            "severity": severity,
            "created_at": datetime.now(timezone.utc),
        }
        event = await orm.create(Event, event_data)
        logger.info(
            "event_recorded",
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            actor_id=actor_id,
            severity=severity,
        )
        return event

    @async_trace("event_service.list")
    async def list_events(
        self,
        entity_type: Optional[str] = None,
        event_type: Optional[str] = None,
        actor_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Event]:
        orm = get_orm()
        qb = orm.query(Event).order("created_at", "desc").limit(limit).offset(offset)
        if entity_type:
            qb.eq("entity_type", entity_type)
        if event_type:
            qb.eq("event_type", event_type)
        if actor_id:
            qb.eq("actor_id", actor_id)
        return await orm.find_by(Event, qb)

    @async_trace("event_service.count")
    async def count_events(
        self,
        entity_type: Optional[str] = None,
        event_type: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> int:
        orm = get_orm()
        qb = orm.query(Event)
        if entity_type:
            qb.eq("entity_type", entity_type)
        if event_type:
            qb.eq("event_type", event_type)
        if actor_id:
            qb.eq("actor_id", actor_id)
        return await orm.count(Event, qb)


event_service = EventService()
