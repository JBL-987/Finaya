"""
Custom exceptions for the application
"""
from typing import Optional, Dict, Any


class FinayaException(Exception):
    """Base exception for Finaya application"""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        context: Optional[str] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__.replace('Error', '').upper()
        self.details = details or {}
        self.context = context  # Additional context like operation, module, etc.
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API response"""
        return {
            "error": {
                "code": self.error_code,
                "message": self.message,
                "status_code": self.status_code,
                "context": self.context,
                "details": self.details
            }
        }


class AuthenticationError(FinayaException):
    """Authentication related errors"""

    def __init__(
        self,
        message: str = "Authentication failed",
        context: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message,
            401,
            "AUTH_FAILED",
            details,
            context or "User authentication required"
        )


class AuthorizationError(FinayaException):
    """Authorization related errors"""

    def __init__(
        self,
        message: str = "Access denied",
        context: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message,
            403,
            "ACCESS_DENIED",
            details,
            context or "Insufficient permissions"
        )


class ValidationError(FinayaException):
    """Data validation errors"""

    def __init__(
        self,
        message: str = "Validation failed",
        field: Optional[str] = None,
        context: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if field:
            error_details["field"] = field

        super().__init__(
            message,
            422,
            "VALIDATION_FAILED",
            error_details,
            context or f"Validation error in {field or 'unknown field'}"
        )


class NotFoundError(FinayaException):
    """Resource not found errors"""

    def __init__(
        self,
        message: str = "Resource not found",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        context: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if resource_type:
            error_details["resource_type"] = resource_type
        if resource_id:
            error_details["resource_id"] = resource_id

        super().__init__(
            message,
            404,
            "RESOURCE_NOT_FOUND",
            error_details,
            context or f"Resource {resource_type or 'unknown'} not found"
        )


class DatabaseError(FinayaException):
    """Database operation errors"""

    def __init__(
        self,
        message: str = "Database operation failed",
        operation: Optional[str] = None,
        context: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if operation:
            error_details["operation"] = operation

        super().__init__(
            message,
            500,
            "DATABASE_ERROR",
            error_details,
            context or f"Database operation failed: {operation or 'unknown'}"
        )


class ExternalServiceError(FinayaException):
    """External service errors (OpenRouter, Gemini, Supabase, etc.)"""

    def __init__(
        self,
        message: str = "External service error",
        service_name: Optional[str] = None,
        operation: Optional[str] = None,
        context: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if service_name:
            error_details["service"] = service_name
        if operation:
            error_details["operation"] = operation

        super().__init__(
            message,
            502,
            "EXTERNAL_SERVICE_ERROR",
            error_details,
            context or f"External service {service_name or 'unknown'} failed"
        )


class BusinessLogicError(FinayaException):
    """Business logic specific errors"""

    def __init__(
        self,
        message: str = "Business logic error",
        operation: Optional[str] = None,
        context: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if operation:
            error_details["operation"] = operation

        super().__init__(
            message,
            400,
            "BUSINESS_LOGIC_ERROR",
            error_details,
            context or f"Business logic violation: {operation or 'unknown'}"
        )
