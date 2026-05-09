import asyncio
import json
from typing import Any, Callable, Optional

import redis.asyncio as aioredis

from app.core.config import settings
from app.core.observability import logger


class RedisCache:
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
                    logger.warning("redis_cache_retry", attempt=attempt + 1, backoff=backoff, error=str(e))
                    await asyncio.sleep(backoff)
                    backoff = min(backoff * 2, 10)
            logger.error("redis_cache_connection_failed")
            raise last_exception or RuntimeError("Failed to connect to Redis")
        return self._redis

    async def get(self, key: str) -> Optional[Any]:
        r = await self._get_redis()
        data = await r.get(key)
        if data is None:
            return None
        try:
            return json.loads(data)
        except (json.JSONDecodeError, TypeError):
            return data

    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        r = await self._get_redis()
        await r.setex(key, ttl, json.dumps(value))

    async def delete(self, key: str) -> None:
        r = await self._get_redis()
        await r.delete(key)

    async def get_or_set(self, key: str, factory: Callable, ttl: int = 300) -> Any:
        cached = await self.get(key)
        if cached is not None:
            return cached
        value = await factory()
        await self.set(key, value, ttl)
        return value

    async def close(self):
        if self._redis:
            await self._redis.close()
            self._redis = None


cache = RedisCache()
