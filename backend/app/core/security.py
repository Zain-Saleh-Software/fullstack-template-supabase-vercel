import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt

import bcrypt

from app.core.config import settings

def hash_password(password: str) -> str:
    # bcrypt requires bytes
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), 
        hashed_password.encode("utf-8")
    )


def _get_key() -> str:
    """Return the shared secret for HS256 signing and verification."""
    return settings.jwt_secret


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "iss": settings.app_name,
        "aud": f"{settings.app_name}:api",
        "jti": str(uuid.uuid4()),
    })
    return jwt.encode(to_encode, _get_key(), algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.jwt_refresh_token_expire_days
    )
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "iss": settings.app_name,
        "aud": f"{settings.app_name}:api",
        "jti": str(uuid.uuid4()),
        "type": "refresh",
    })
    return jwt.encode(to_encode, _get_key(), algorithm=settings.jwt_algorithm)


class ExpiredTokenError(Exception):
    pass


class InvalidTokenError(Exception):
    pass


class MalformedTokenError(Exception):
    pass


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token using HS256.

    Security model:
    Uses a single algorithm (HS256) with a single shared secret.
    No fallback algorithms — prevents JWT algorithm confusion attacks.
    """
    try:
        payload = jwt.decode(
            token,
            _get_key(),
            algorithms=["HS256"],
            audience=f"{settings.app_name}:api",
            issuer=settings.app_name,
            options={"verify_signature": True, "require": ["exp", "iat", "iss", "aud"]},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise ExpiredTokenError("Token has expired")
    except jwt.JWTClaimsError:
        raise InvalidTokenError("Invalid token claims")
    except JWTError:
        raise MalformedTokenError("Malformed token")
