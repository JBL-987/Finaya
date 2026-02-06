"""
Security utilities for input validation, sanitization, and key management.
(Authentication is handled via Firebase in auth.py)
"""
import re
from typing import Optional
from fastapi import HTTPException, status

class SecurityManager:
    """Centralized security utilities"""
    
    @staticmethod
    def sanitize_input(text: str) -> str:
        """
        Sanitize string input to prevent basic injection/XSS attempts.
        Removes potentially dangerous characters.
        """
        if not text:
            return ""
        # Remove common dangerous characters for NoSQL/Basic Injection
        # We allow standard punctuation but strip script tags or potential command chars if strict
        sanitized = re.sub(r'[<>{}$]', '', text) 
        return sanitized.strip()

    @staticmethod
    def validate_api_key_format(api_key: str, provider: str = "google") -> bool:
        """
        Validate the format of an API key before external calls.
        """
        if provider == "google":
            # Google API keys usually start with AIza
            return bool(re.match(r'^AIza[0-9A-Za-z\-_]{35}$', api_key))
        return True

    @staticmethod
    def check_safe_coordinates(lat: float, lng: float) -> bool:
        """
        Verify coordinates are within valid earth ranges.
        """
        if not (-90 <= lat <= 90):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid latitude")
        if not (-180 <= lng <= 180):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid longitude")
        return True

    @staticmethod
    def masking_email(email: str) -> str:
        """
        Mask email for logging purposes (e.g. j***@gmail.com)
        """
        try:
            user, domain = email.split('@')
            return f"{user[:1]}***@{domain}"
        except:
            return "invalid_email"
