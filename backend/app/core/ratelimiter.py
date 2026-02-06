from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.responses import JSONResponse
from fastapi import Request, HTTPException
from redis.asyncio import Redis
from contextlib import asynccontextmanager
from typing import Optional, Callable
import logging
import asyncio

from .config import settings

logger = logging.getLogger(__name__)

class RateLimiter:
    """Enhanced rate limiter with Redis backend and fallback"""

    def __init__(self):
        self._limiter = None
        self._redis = None
        self._initialized = False
        self._lock = asyncio.Lock()

    async def initialize(self):
        """Initialize rate limiter with Redis backend"""
        if self._initialized:
            return

        async with self._lock:
            if self._initialized:
                return

            try:
                # Initialize Redis client
                self._redis = Redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
                await self._redis.ping()

                # Initialize limiter with Redis backend
                self._limiter = Limiter(
                    key_func=get_remote_address,
                    storage_uri=settings.REDIS_URL,
                    default_limits=[f"{settings.RATE_LIMIT_REQUESTS} per {settings.RATE_LIMIT_WINDOW} seconds"]
                )
                logger.info(" Rate limiter initialized with Redis backend")
            except Exception as e:
                logger.warning(f" Redis not available, using in-memory rate limiting: {e}")
                # Fallback to in-memory limiter
                self._limiter = Limiter(
                    key_func=get_remote_address,
                    default_limits=[f"{settings.RATE_LIMIT_REQUESTS} per {settings.RATE_LIMIT_WINDOW} seconds"]
                )

            self._initialized = True

    @property
    def limiter(self):
        """Get the limiter instance"""
        if not self._initialized:
            raise RuntimeError("Rate limiter not initialized. Call initialize() first.")
        return self._limiter

    async def close(self):
        """Close Redis connection"""
        if self._redis:
            await self._redis.close()

# Global rate limiter instance
rate_limiter = RateLimiter()

# Dependency injection functions
async def get_limiter():
    """Dependency to get initialized limiter"""
    if not rate_limiter._initialized:
        await rate_limiter.initialize()
    return rate_limiter.limiter

# Rate limiting decorators for different endpoints
class RateLimitConfig:
    """Configuration for different rate limit strategies"""

    # General API endpoints
    GENERAL = f"{settings.RATE_LIMIT_REQUESTS} per {settings.RATE_LIMIT_WINDOW} seconds"

    # Authentication endpoints (stricter limits)
    AUTH = f"{settings.AUTH_RATE_LIMIT_REQUESTS} per {settings.AUTH_RATE_LIMIT_WINDOW} seconds"

    # Write operations (API creation/updates)
    WRITE = f"{settings.RATE_LIMIT_REQUESTS // 2} per {settings.RATE_LIMIT_WINDOW} seconds"

    # Analysis endpoints (computationally expensive)
    ANALYSIS = f"{settings.RATE_LIMIT_REQUESTS // 4} per {settings.RATE_LIMIT_WINDOW * 2} seconds"

    @staticmethod
    def by_endpoint(request: Request) -> str:
        """Dynamic rate limit based on endpoint"""
        path = request.url.path

        if path.startswith("/api/v1/auth/"):
            return RateLimitConfig.AUTH
        elif any(path.endswith(endpoint) for endpoint in ["/create", "/update", "/delete"]):
            return RateLimitConfig.WRITE
        elif path.startswith("/api/v1/analysis/"):
            return RateLimitConfig.ANALYSIS
        else:
            return RateLimitConfig.GENERAL

# Custom rate limit exceeded handler
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded"""
    logger.warning(f"Rate limit exceeded for {get_remote_address(request)} on {request.url.path}")
    return JSONResponse(
        status_code=429,
        content={
            "error": "Too Many Requests",
            "message": "Rate limit exceeded. Please try again later.",
            "details": exc.detail,
            "retry_after": settings.RATE_LIMIT_WINDOW
        }
    )

@asynccontextmanager
async def rate_limiter_context():
    """Context manager for rate limiter lifecycle"""
    try:
        yield
    finally:
        await rate_limiter.close()

# Middleware for FastAPI
def create_limiter_middleware(limiter: Limiter) -> SlowAPIMiddleware:
    """Create SlowAPI middleware"""
    return SlowAPIMiddleware(
        limiter=limiter,
        config={
            'slowapi/rate_limit_exceeded': rate_limit_exceeded_handler
        }
    )
