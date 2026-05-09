"""
Auth Service — handles user registration, login, token refresh.

EVENTS TABLE USAGE:
  - auth.register: WRITE to events table. Business-critical record.
    "Did this user sign up?" is a question a business owner asks.
    Needed for audit, user counting, and compliance.

  - auth.login: DO NOT write to events table. Technical operation.
    "Did user X log in at 3am?" is a security/ops question → use logs.
    Every login does not need permanent DB storage.

LOGS vs EVENTS decision for each operation:
  - registration  → Event (business: permanent user record)
  - login         → Log (technical: session activity, high volume)
  - failed login  → Log + warning metric (security monitoring)
  - token refresh → Log (technical: token lifecycle)
"""

import uuid
from datetime import datetime, timezone

import bleach
from fastapi import HTTPException, status

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    ExpiredTokenError,
    InvalidTokenError,
    MalformedTokenError,
)
from app.core.token_blacklist import token_blacklist
from app.core.observability import logger, async_trace, auth_failures_total
from app.models.user import User
from app.orm import get_orm
from app.services.event_service import event_service


class AuthService:
    @async_trace("auth_service.register")
    async def register(self, request) -> dict:
        orm = get_orm()

        if len(request.password) < 8:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Password must be at least 8 characters",
            )

        now = datetime.now(timezone.utc)
        user_data = {
            "id": str(uuid.uuid4()),
            "email": request.email,
            "hashed_password": hash_password(request.password),
            "full_name": bleach.clean(request.full_name or '', tags=[], strip=True),
            "role": "customer",
            "is_active": True,
            "is_superuser": False,
            "created_at": now,
            "updated_at": now,
        }

        try:
            user = await orm.create(User, user_data)
        except Exception:
            logger.warning("auth.register.duplicate_email", email=request.email)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        access_token = create_access_token(data={"sub": user.id})
        refresh_token = create_refresh_token(data={"sub": user.id})

        # ⭐ BUSINESS EVENT: permanent record of user signup
        # NOTE: Direct call to event_service.record() is intentional for MVP.
        # Tight coupling accepted for simplicity; extract via message queue if needed later.
        await event_service.record(
            event_type="auth.register",
            entity_type="user",
            entity_id=user.id,
            metadata={"email": user.email},
        )

        logger.info("auth.register.success", user_id=user.id, email=user.email)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user.to_response(),
        }

    @async_trace("auth_service.login")
    async def login(self, request) -> dict:
        orm = get_orm()
        users = await orm.find_by(
            User, orm.query(User).eq("email", request.email)
        )
        if not users:
            auth_failures_total.labels(reason="invalid_credentials").inc()
            logger.warning("auth.login.user_not_found", email=request.email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        user = users[0]
        if not verify_password(request.password, user.hashed_password):
            auth_failures_total.labels(reason="invalid_credentials").inc()
            logger.warning("auth.login.wrong_password", user_id=user.id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        access_token = create_access_token(data={"sub": user.id})
        refresh_token = create_refresh_token(data={"sub": user.id})

        # 🔧 TECHNICAL: login is high-volume, session-level — logs only
        logger.info("auth.login.success", user_id=user.id, role=user.role)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user.to_response(),
        }

    @async_trace("auth_service.refresh")
    async def refresh(self, refresh_token_str: str) -> dict:
        try:
            payload = decode_token(refresh_token_str)
        except (ExpiredTokenError, InvalidTokenError, MalformedTokenError):
            logger.warning("auth.refresh.invalid_token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        if payload.get("type") != "refresh":
            logger.warning("auth.refresh.invalid_token_type")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        user_id = payload.get("sub")
        jti = payload.get("jti")

        if jti:
            if await token_blacklist.is_refresh_used(jti):
                auth_failures_total.labels(reason="token_reuse").inc()
                await token_blacklist.revoke_all_user_tokens(user_id)
                logger.warning("auth.refresh.token_reuse_detected", user_id=user_id)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token has been revoked",
                )
            exp = payload.get("exp")
            ttl = exp - int(datetime.now(timezone.utc).timestamp()) if exp else 3600
            await token_blacklist.mark_refresh_used(jti, user_id, max(ttl, 60))

        user = await get_orm().find_by_id(User, user_id)
        if user is None:
            logger.warning("auth.refresh.user_not_found", user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        access_token = create_access_token(data={"sub": user.id})
        new_refresh_token = create_refresh_token(data={"sub": user.id})

        logger.info("auth.refresh.success", user_id=user.id)
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "user": user.to_response(),
        }

    async def get_me(self, user: User) -> dict:
        return user.to_response()


auth_service = AuthService()
