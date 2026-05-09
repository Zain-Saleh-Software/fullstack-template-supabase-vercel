from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_token, ExpiredTokenError, InvalidTokenError, MalformedTokenError
from app.core.token_blacklist import token_blacklist
from app.core.observability import auth_failures_total, user_id_var
from app.models.user import User
from app.orm import get_orm

security = HTTPBearer()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    cached = getattr(request.state, "current_user", None)
    if cached is not None:
        return cached
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except ExpiredTokenError:
        auth_failures_total.labels(reason="expired_token").inc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except (InvalidTokenError, MalformedTokenError):
        auth_failures_total.labels(reason="invalid_token").inc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    jti = payload.get("jti")
    if jti and await token_blacklist.is_blacklisted(jti):
        auth_failures_total.labels(reason="revoked_token").inc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    user = await get_orm().find_by_id(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not active",
        )
    request.state.current_user = user
    user_id_var.set(user.id)
    return user


async def get_optional_user(
    authorization: str = Header(None),
) -> User | None:
    if not authorization:
        return None
    if not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    try:
        payload = decode_token(token)
    except Exception:
        return None
    if payload is None:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    user = await get_orm().find_by_id(User, user_id)
    if user and not user.is_active:
        return None
    return user
