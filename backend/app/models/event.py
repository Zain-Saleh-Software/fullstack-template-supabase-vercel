from typing import Any, Optional
from pydantic import BaseModel
from datetime import datetime


class Event(BaseModel):
    id: str
    event_type: str
    entity_type: str
    entity_id: Optional[str] = None
    actor_id: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    severity: str = "info"
    created_at: Optional[datetime] = None

    @staticmethod
    def _table() -> str:
        return "events"

    def to_response(self) -> dict:
        return {
            "id": self.id,
            "event_type": self.event_type,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "actor_id": self.actor_id,
            "severity": self.severity,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
