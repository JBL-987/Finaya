from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import logging

from app.core.config import settings
from app.core.database import init_db
from app.core.dependencies import container, container_context
from app.core.ratelimiter import rate_limiter, rate_limit_exceeded_handler  
from app.api.v1.auth import router as auth_router
from app.api.v1.analysis import router as analysis_router
from app.core.middleware import RequestLoggingMiddleware
from slowapi.errors import RateLimitExceeded

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger = logging.getLogger(__name__)
    logger.info(" Starting Finaya Backend...")

    # Initialize rate limiter first
    try:
        await rate_limiter.initialize()
        app.state.limiter = rate_limiter.limiter
        app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
        logger.info("Rate limiter initialized and added to app state")
    except Exception as e:
        logger.error(f"❌ Failed to initialize rate limiter: {e}")
        raise

    # Initialize dependency container
    try:
        await container.initialize()
        logger.info("Dependency container initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize dependency container: {e}")
        raise

    # Initialize database
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database init failed: {e}")

    logger.info("All services initialized successfully")

    yield  # <---- app runs here

    # Graceful shutdown
    logger.info("Shutting down Finaya Backend...")
    try:
        await container.close()
        await rate_limiter.close()
        logger.info("Services shut down gracefully")
    except Exception as e:
        logger.error(f"❌ Error during shutdown: {e}")

# Create FastAPI application
app = FastAPI(
    title="Finaya API",
    description="AI-Powered Business Location Analysis Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# CORS Configuration - Permissive for Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Custom Middleware
app.add_middleware(RequestLoggingMiddleware)

# Health Check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Finaya API",
        "version": "1.0.0"
    }

from app.api.v1.agent import router as agent_router
from app.api.v1.places import router as places_router

# API Routes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(analysis_router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(agent_router, prefix="/api/v1/agent", tags=["AI Agent"])
app.include_router(places_router, prefix="/api/v1/places", tags=["Places"])

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Finaya API",
        "docs": "/api/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
