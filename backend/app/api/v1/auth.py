import time

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.dependencies import get_current_user
from app.core.rate_limit import limiter
from app.core.security import decode_token, ExpiredTokenError, InvalidTokenError, MalformedTokenError
from app.core.token_blacklist import token_blacklist
from app.models.user import User
from app.schemas.auth import (
    LoginRequest, RegisterRequest, RefreshRequest, TokenResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.services.auth_service import auth_service

security = HTTPBearer()

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
@limiter.limit("10/minute")
async def register(request: Request, body: RegisterRequest):
    return await auth_service.register(body)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest):
    return await auth_service.login(body)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
async def refresh(request: Request, body: RefreshRequest):
    return await auth_service.refresh(body.refresh_token)


@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = decode_token(credentials.credentials)
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            ttl = max(exp - int(time.time()), 60)
            await token_blacklist.blacklist(jti, int(ttl))
    except (ExpiredTokenError, InvalidTokenError, MalformedTokenError):
        pass
    return {"message": "Logged out"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return await auth_service.get_me(current_user)


@router.post("/forgot-password")
@limiter.limit("3/hour")
async def forgot_password(request: Request, body: ForgotPasswordRequest):
    return await auth_service.forgot_password(body.email)


@router.post("/reset-password")
@limiter.limit("5/15minutes")
async def reset_password(request: Request, body: ResetPasswordRequest):
    return await auth_service.reset_password(body)
