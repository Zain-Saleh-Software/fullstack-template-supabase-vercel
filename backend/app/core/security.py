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


def _get_signing_key() -> str:
    """Return the private key for RS256 or the shared secret for HS256."""
    if settings.jwt_algorithm == "RS256" and settings.jwt_private_key:
        return settings.jwt_private_key
    return settings.jwt_secret


def _get_verification_key() -> str:
    """Return the verification key matching the configured algorithm.
    RS256 → public key, HS256 → shared secret.
    """
    if settings.jwt_algorithm == "RS256" and settings.jwt_public_key:
        return settings.jwt_public_key
    return settings.jwt_secret


def _get_fallback_key() -> str | None:
    """Return the fallback key for algorithm migration (RS256→HS256 transition)."""
    if settings.jwt_algorithm == "RS256" and settings.jwt_secret:
        return settings.jwt_secret
    return None


def _get_fallback_algorithm() -> str | None:
    """Return the fallback algorithm if a different signing key exists."""
    if settings.jwt_algorithm == "RS256" and settings.jwt_secret:
        return "HS256"
    return None


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
    return jwt.encode(to_encode, _get_signing_key(), algorithm=settings.jwt_algorithm)


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
    return jwt.encode(to_encode, _get_signing_key(), algorithm=settings.jwt_algorithm)


class ExpiredTokenError(Exception):
    pass


class InvalidTokenError(Exception):
    pass


class MalformedTokenError(Exception):
    pass


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token.
    
    Security model:
    1. Try with the configured algorithm and its key FIRST (no fallback algorithms).
       For RS256: only RS256 with public key. For HS256: only HS256 with shared secret.
    2. If that fails and there's a fallback key (e.g., HS256 secret during RS256→HS256 migration),
       try the fallback. This prevents the classic JWT algorithm confusion attack.
    """
    primary_key = _get_verification_key()
    primary_algorithms = [settings.jwt_algorithm]
    last_error = None

    try:
        payload = jwt.decode(
            token,
            primary_key,
            algorithms=primary_algorithms,
            audience=f"{settings.app_name}:api",
            issuer=settings.app_name,
            options={"verify_signature": True, "require": ["exp", "iat", "iss", "aud"]},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise ExpiredTokenError("Token has expired")
    except (jwt.JWTClaimsError, JWTError) as e:
        last_error = e

    fallback_key = _get_fallback_key()
    fallback_alg = _get_fallback_algorithm()
    if fallback_key and fallback_alg:
        try:
            payload = jwt.decode(
                token,
                fallback_key,
                algorithms=[fallback_alg],
                audience=f"{settings.app_name}:api",
                issuer=settings.app_name,
                options={"verify_signature": True, "require": ["exp", "iat", "iss", "aud"]},
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise ExpiredTokenError("Token has expired")
        except (jwt.JWTClaimsError, JWTError) as e2:
            last_error = e2

    if isinstance(last_error, jwt.JWTClaimsError):
        raise InvalidTokenError("Invalid token claims")
    raise MalformedTokenError("Malformed token")
