from datetime import datetime, timezone
from typing import Annotated, Any, Optional
from uuid import UUID as _UUID

from pydantic import BaseModel, BeforeValidator


def _coerce_id(v: Any) -> str:
    if isinstance(v, _UUID):
        return str(v)
    return v


PyUUID = Annotated[str, BeforeValidator(_coerce_id)]


class AppBaseModel(BaseModel):
    id: PyUUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @staticmethod
    def _table() -> str:
        raise NotImplementedError

    def to_dict(self, exclude_fields: Optional[list[str]] = None) -> dict[str, Any]:
        exclude = set(exclude_fields or [])
        exclude.update({"created_at", "updated_at"})
        return self.model_dump(exclude=exclude, exclude_none=True)

    def to_response(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


