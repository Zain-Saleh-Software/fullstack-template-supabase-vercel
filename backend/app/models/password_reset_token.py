from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class PasswordResetToken(BaseModel):
    id: str
    user_id: str
    hashed_token: str
    expires_at: datetime
    used_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    @staticmethod
    def _table() -> str:
        return "password_reset_tokens"
