from datetime import datetime

from fastapi import APIRouter, Query

from app.schemas.table_change import ChangeCheckResponse
from app.services.change_service import change_service

router = APIRouter(prefix="/changes", tags=["changes"])


@router.get("/check", response_model=ChangeCheckResponse)
async def check_changes(
    since: str = Query(..., description="ISO-8601 timestamp to check for changes since"),
):
    since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
    result = await change_service.check_changes(since_dt)
    return result
