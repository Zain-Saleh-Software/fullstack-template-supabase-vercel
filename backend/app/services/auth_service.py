"""
Auth Service — handles user registration, login, token refresh, password reset.

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
  - forgot password → Log only (no business value to persist)
  - password reset  → Log only (covered by logs, event table would add noise)
"""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bleach
import httpx
from fastapi import HTTPException, status

from app.core.config import settings
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
from app.models.password_reset_token import PasswordResetToken
from app.orm import get_orm
from app.services.event_service import event_service

PWNED_PASSWORDS_API = "https://api.pwnedpasswords.com/range/"


class AuthService:
    async def _check_breached_password(self, password: str) -> None:
        sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]

        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{PWNED_PASSWORDS_API}{prefix}")
                if resp.status_code == 200:
                    hashes = (line.split(":")[0] for line in resp.text.splitlines())
                    if suffix in hashes:
                        raise HTTPException(
                            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="This password has been exposed in a data breach. Please choose a different password.",
                        )
        except httpx.TimeoutException:
            logger.warning("auth.breached_password_check.timeout")
        except HTTPException:
            raise
        except Exception:
            logger.warning("auth.breached_password_check.error")

    @async_trace("auth_service.register")
    async def register(self, request) -> dict:
        orm = get_orm()

        # No MFA implemented → enforce 15 char minimum (NIST SP800-63B)
        if len(request.password) < 15:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Password must be at least 15 characters",
            )
        if len(request.password) > 128:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Password must be at most 128 characters",
            )

        # Check against Pwned Passwords API (k-anonymity model)
        await self._check_breached_password(request.password)

        now = datetime.now(timezone.utc)
        user_data = {
            "id": str(uuid.uuid4()),
            "email": request.email,
            "hashed_password": hash_password(request.password),
            "full_name": bleach.clean(request.full_name, tags=[], strip=True),
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
        """
        Authenticate user with anti-timing-attack and per-account lockout.
        Always performs bcrypt verification regardless of user existence
        to prevent timing side-channels (see authentication-patterns.md §9).
        """
        orm = get_orm()

        # Always query — same first step regardless of user existence
        users = await orm.find_by(
            User, orm.query(User).eq("email", request.email)
        )

        # Constant-time guard: always verify a hash.
        # If user found → verify real hash. If not → verify dummy hash.
        # This ensures bcrypt verification runs in both cases,
        # preventing timing side-channels that reveal user existence.
        dummy_hash = hash_password("auth-timing-guard-dummy-" + secrets.token_urlsafe(8))
        user = users[0] if users else User(
            id="", email="", hashed_password=dummy_hash, is_active=False,
        )
        password_valid = verify_password(request.password, user.hashed_password)

        # Record failed attempts for real accounts only
        if users:
            if not password_valid:
                auth_failures_total.labels(reason="invalid_credentials").inc()
                await token_blacklist.record_failed_attempt(user.id)
                attempt_count = await token_blacklist.get_failed_attempts(user.id)
                if attempt_count >= 10:
                    backoff = min(60 * (2 ** min(attempt_count // 10 - 1, 4)), 900)
                    await token_blacklist.lock_account(user.id, backoff)
                    logger.warning("auth.login.account_locked", user_id=user.id, backoff=backoff)
                    auth_failures_total.labels(reason="account_locked").inc()

                logger.warning("auth.login.failed", user_id=user.id)

                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password",
                )

            # Check account lockout
            if await token_blacklist.is_account_locked(user.id):
                logger.warning("auth.login.locked_attempt", user_id=user.id)
                auth_failures_total.labels(reason="account_locked").inc()
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password",
                )

            # Clear failed attempts on successful login
            await token_blacklist.clear_failed_attempts(user.id)
        else:
            # Password verification already happened above (constant-time)
            # If we reach here, password could not have matched (no user record)
            # but we still ran bcrypt. Now return generic error.
            auth_failures_total.labels(reason="invalid_credentials").inc()
            logger.warning("auth.login.user_not_found", email=request.email)
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

    @async_trace("auth_service.forgot_password")
    async def forgot_password(self, email: str) -> dict:
        """
        Initiate password reset flow.
        ALWAYS returns the same generic message regardless of whether the
        account exists (anti-enumeration, see §9 of authentication-patterns.md).
        Uses consistent timing — always performs the same operations.
        """
        orm = get_orm()
        generic_message = {
            "message": "If that email address is in our database, we will send you an email to reset your password."
        }

        users = await orm.find_by(
            User, orm.query(User).eq("email", email)
        )

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=settings.password_reset_token_expire_minutes)

        # Generate cryptographically secure token (32+ bytes entropy)
        token = secrets.token_urlsafe(48)
        hashed = hash_password(token)

        if users:
            user = users[0]
            # Store hashed token in DB (only for real accounts)
            await orm.create(PasswordResetToken, {
                "id": str(uuid.uuid4()),
                "user_id": user.id,
                "hashed_token": hashed,
                "expires_at": expires_at,
                "created_at": now,
            })

            # Build reset URL from config (NOT from Host header — prevents Host Header Injection)
            reset_url = f"{settings.password_reset_base_url.rstrip('/')}/{token}"

            logger.info(
                "auth.forgot_password.token_created",
                user_id=user.id,
                expires_at=expires_at.isoformat(),
            )

            # NOTE: Send email with reset URL in production.
            # The email MUST NOT include the password or any sensitive data.
            logger.info(
                "auth.forgot_password.email_queued",
                user_id=user.id,
                email=email,
                reset_url=reset_url,
            )
        else:
            # Consistent timing: token generation + hashing already done above
            logger.info("auth.forgot_password.nonexistent_account", email=email)

        return generic_message

    @async_trace("auth_service.reset_password")
    async def reset_password(self, request) -> dict:
        """
        Complete password reset flow.
        - Verifies token (hashed comparison)
        - Validates new password strength
        - Confirms password matches password_confirm
        - Updates password, invalidates all sessions
        - Does NOT auto-login
        """
        orm = get_orm()

        # Validate password match
        if request.password != request.password_confirm:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Passwords do not match",
            )

        # Validate password strength (no MFA → 15 char minimum)
        if len(request.password) < 15:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Password must be at least 15 characters",
            )
        if len(request.password) > 128:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Password must be at most 128 characters",
            )

        # Find all non-expired, non-used tokens
        now = datetime.now(timezone.utc)
        tokens = await orm.find_by(
            PasswordResetToken,
            orm.query(PasswordResetToken)
                .is_null("used_at")
                .gt("expires_at", now),
        )

        # Verify token against stored hashes (constant-time comparison via bcrypt)
        # Always iterate ALL tokens to prevent timing side-channels
        matched_token = None
        for t in tokens:
            if verify_password(request.token, t.hashed_token):
                matched_token = t

        if matched_token is None:
            logger.warning("auth.reset_password.invalid_token")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        # Update password
        new_hashed = hash_password(request.password)
        await orm.update(User, matched_token.user_id, {
            "hashed_password": new_hashed,
            "updated_at": now,
        })

        # Mark token as used (single-use invalidation)
        await orm.update(PasswordResetToken, matched_token.id, {
            "used_at": now,
        })

        # Invalidate ALL existing sessions (token theft protection)
        await token_blacklist.revoke_all_user_tokens(matched_token.user_id)

        logger.info(
            "auth.reset_password.success",
            user_id=matched_token.user_id,
        )

        # NOTE: Send notification email to the user informing them that
        # their password has been reset. NEVER include the new password
        # in the email.

        # DO NOT auto-login — redirect to login page
        return {
            "message": "Your password has been reset successfully. Please log in with your new password.",
        }

    async def get_me(self, user: User) -> dict:
        return user.to_response()


auth_service = AuthService()
