from pydantic import BaseModel


class ChangeCheckResponse(BaseModel):
    has_changes: bool
    tables: list[str]
