from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.auth import router as auth_router
from app.api.v1.analysis import router as analysis_router
from app.api.v1.accounting import router as accounting_router
from app.api.v1.advisor import router as advisor_router
from app.api.v1.document import router as document_router
from app.core.middleware import RequestLoggingMiddleware

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    print("🚀 Starting Finaya Backend...")

    try:
        await init_db()
    except Exception as e:
        print(f"⚠️ Warning: Supabase init failed during startup: {e}")

    yield
    print("👋 Shutting down Finaya Backend...")


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

# CORS Configuration
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# API Routes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(analysis_router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(accounting_router, prefix="/api/v1/accounting", tags=["Accounting"])
app.include_router(advisor_router, prefix="/api/v1/advisor", tags=["Advisor"])
app.include_router(document_router, prefix="/api/v1/document", tags=["Document"])

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
