from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.auth import router as auth_router
from app.api.v1.analysis import router as analysis_router
from app.api.v1.accounting import router as accounting_router
from app.api.v1.advisor import router as advisor_router
from app.api.v1.document import router as document_router
from app.core.middleware import RequestLoggingMiddleware
from app.core.exceptions import FinayaException

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

# Global Exception Handlers
@app.exception_handler(FinayaException)
async def finaya_exception_handler(request: Request, exc: FinayaException):
    """Handle custom Finaya exceptions with structured responses"""
    import logging
    logger = logging.getLogger(__name__)

    # Log the error with context
    logger.error(
        f"Finaya Exception - Code: {exc.error_code}, Message: {exc.message}, Context: {exc.context}, "
        f"Details: {exc.details}"
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with detailed field information"""
    import logging
    logger = logging.getLogger(__name__)

    # Extract field errors for better debugging
    errors = []
    for error in exc.errors():
        field_path = ".".join(str(x) for x in error["loc"])
        errors.append({
            "field": field_path,
            "message": error["msg"],
            "type": error["type"]
        })

    error_message = "Request validation failed"
    if errors:
        error_message = f"Validation error in field '{errors[0]['field']}': {errors[0]['message']}"

    logger.error(f"Request Validation Error: {exc.errors()}")

    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_FAILED",
                "message": error_message,
                "status_code": 422,
                "context": "Request validation failed",
                "details": {
                    "validation_errors": errors
                }
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions with basic error information"""
    import logging
    logger = logging.getLogger(__name__)

    # Log the unexpected error
    logger.error(f"Unexpected error: {type(exc).__name__}: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "status_code": 500,
                "context": "Internal server error",
                "details": {
                    "error_type": type(exc).__name__
                }
            }
        }
    )

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
