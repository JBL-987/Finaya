from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import logging

logger = logging.getLogger(__name__)

class OptionsMiddleware(BaseHTTPMiddleware):
    """Skip all processing for OPTIONS requests (CORS preflight)"""
    
    async def dispatch(self, request: Request, call_next):
        # ✅ Skip all middleware processing for OPTIONS
        if request.method == "OPTIONS":
            return await call_next(request)
        
        return await call_next(request)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all incoming requests"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip logging OPTIONS to reduce noise
        if request.method == "OPTIONS":
            return await call_next(request)
            
        start_time = time.time()
        
        # Log request
        logger.info(f"Request: {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log response
            logger.info(
                f"Response: {response.status_code} - "
                f"Processed in {process_time:.3f}s"
            )
            
            # Add custom header
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            logger.error(f"Request failed: {str(e)}")
            raise