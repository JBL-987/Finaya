"""
Custom exceptions for the application
"""
from typing import Optional


class FinayaException(Exception):
    """Base exception for Finaya application"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class AuthenticationError(FinayaException):
    """Authentication related errors"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, 401)


class AuthorizationError(FinayaException):
    """Authorization related errors"""
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, 403)


class ValidationError(FinayaException):
    """Data validation errors"""
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, 422)


class NotFoundError(FinayaException):
    """Resource not found errors"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, 404)


class DatabaseError(FinayaException):
    """Database operation errors"""
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, 500)


class ExternalServiceError(FinayaException):
    """External service errors (Firebase, Gemini, etc.)"""
    def __init__(self, message: str = "External service error"):
        super().__init__(message, 502)
