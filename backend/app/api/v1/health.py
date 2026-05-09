from fastapi import APIRouter

from app.core.config import settings
from app.orm import get_orm
from app.models.user import User

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    db_ok = False
    try:
        await get_orm().count(User)
        db_ok = True
    except Exception:
        db_ok = False

    from app.core.token_blacklist import token_blacklist
    redis_ok = await token_blacklist.health_check()

    # Health status: DB down = degraded (app cannot function without DB).
    # Redis down = still ok (app works, just without caching/token blacklist).
    # This prevents orchestrators from killing the container when Redis is temporarily unavailable.
    if not db_ok:
        overall = "degraded"
    else:
        overall = "ok"

    return {
        "status": overall,
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "database": "connected" if db_ok else "disconnected",
        "redis": "connected" if redis_ok else "disconnected",
    }
