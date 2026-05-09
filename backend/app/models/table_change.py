from datetime import datetime
from typing import Optional

from app.models.base import AppBaseModel


class TableChange(AppBaseModel):
    table_name: str
    operation: str
    changed_at: Optional[datetime] = None

    @staticmethod
    def _table() -> str:
        return "table_changes"

    def to_response(self) -> dict:
        return {
            "id": self.id,
            "table_name": self.table_name,
            "operation": self.operation,
            "changed_at": self.changed_at.isoformat() if self.changed_at else None,
        }
