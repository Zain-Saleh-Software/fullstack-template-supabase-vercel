from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.health import router as health_router
from app.api.v1.roles import router as roles_router
from app.api.v1.events import router as events_router
from app.api.v1.changes import router as changes_router

__all__ = [
    "auth_router",
    "users_router",
    "health_router",
    "roles_router",
    "events_router",
    "changes_router",
]
