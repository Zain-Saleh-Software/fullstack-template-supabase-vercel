import asyncio
import json
from datetime import datetime, timezone
from typing import Optional

import redis.asyncio as aioredis

from app.core.config import settings
from app.core.observability import logger


class TokenBlacklist:
    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            last_exception = None
            backoff = 1
            for attempt in range(5):
                try:
                    self._redis = aioredis.from_url(
                        settings.redis_url,
                        decode_responses=True,
                        socket_connect_timeout=5,
                        socket_timeout=5,
                        retry_on_timeout=True,
                        health_check_interval=30,
                    )
                    await self._redis.ping()
                    return self._redis
                except Exception as e:
                    last_exception = e
                    logger.warning("redis_blacklist_retry", attempt=attempt + 1, backoff=backoff, error=str(e))
                    await asyncio.sleep(backoff)
                    backoff = min(backoff * 2, 10)
            logger.error("redis_blacklist_connection_failed")
            raise last_exception or RuntimeError("Failed to connect to Redis")
        return self._redis

    async def blacklist(self, jti: str, expires_in: int) -> None:
        r = await self._get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.setex(f"blacklist:{jti}", expires_in, "revoked")
            await pipe.execute()

    async def is_blacklisted(self, jti: str) -> bool:
        r = await self._get_redis()
        return await r.exists(f"blacklist:{jti}") > 0

    async def mark_refresh_used(self, jti: str, user_id: str, ttl: int) -> None:
        r = await self._get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.setex(f"refresh_used:{jti}", ttl, user_id)
            await pipe.execute()

    async def is_refresh_used(self, jti: str) -> bool:
        r = await self._get_redis()
        return await r.exists(f"refresh_used:{jti}") > 0

    async def revoke_all_user_tokens(self, user_id: str) -> None:
        r = await self._get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.delete(f"user_tokens:{user_id}")
            await pipe.execute()

    async def health_check(self) -> bool:
        try:
            r = await self._get_redis()
            await r.ping()
            return True
        except Exception:
            return False

    async def record_failed_attempt(self, user_id: str) -> None:
        try:
            r = await self._get_redis()
            key = f"failed_attempts:{user_id}"
            async with r.pipeline(transaction=True) as pipe:
                pipe.incr(key)
                pipe.expire(key, 3600)
                await pipe.execute()
        except Exception:
            logger.warning("redis.unavailable_clear_attempts", user_id=user_id)

    async def get_failed_attempts(self, user_id: str) -> int:
        try:
            r = await self._get_redis()
            val = await r.get(f"failed_attempts:{user_id}")
            return int(val) if val else 0
        except Exception:
            return 0

    async def clear_failed_attempts(self, user_id: str) -> None:
        try:
            r = await self._get_redis()
            await r.delete(f"failed_attempts:{user_id}")
        except Exception:
            pass

    async def lock_account(self, user_id: str, ttl: int) -> None:
        try:
            r = await self._get_redis()
            await r.setex(f"account_locked:{user_id}", ttl, "1")
        except Exception:
            logger.warning("redis.unavailable_lock_account", user_id=user_id)

    async def is_account_locked(self, user_id: str) -> bool:
        try:
            r = await self._get_redis()
            return await r.exists(f"account_locked:{user_id}") > 0
        except Exception:
            return False

    async def close(self):
        if self._redis:
            await self._redis.close()
            self._redis = None


token_blacklist = TokenBlacklist()
