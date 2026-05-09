"""Event factory for creating test event data."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from app.models.event import Event


class EventFactory:
    _counter = 0

    @classmethod
    def build(
        cls,
        event_type: Optional[str] = None,
        entity_type: str = "user",
        entity_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        severity: str = "info",
    ) -> Event:
        cls._counter += 1
        return Event(
            id=str(uuid.uuid4()),
            event_type=event_type or f"test.event.{cls._counter}",
            entity_type=entity_type,
            entity_id=entity_id or str(uuid.uuid4()),
            actor_id=actor_id or str(uuid.uuid4()),
            severity=severity,
            created_at=datetime.now(timezone.utc),
        )

    @classmethod
    def auth_event(cls) -> Event:
        return cls.build(event_type="auth.login", entity_type="user")

    @classmethod
    def error_event(cls) -> Event:
        return cls.build(event_type="system.error", entity_type="system", severity="error")

    @classmethod
    def build_dict(cls, **kwargs) -> dict:
        event = cls.build(**kwargs)
        data = event.model_dump()
        data["created_at"] = data["created_at"].isoformat()
        return data
