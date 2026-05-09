from typing import Any, Optional
from datetime import datetime
from pydantic import BaseModel


class EventResponse(BaseModel):
    id: str
    event_type: str
    entity_type: str
    entity_id: Optional[str] = None
    actor_id: Optional[str] = None
    severity: str = "info"
    created_at: Optional[datetime] = None
