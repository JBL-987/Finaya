"""
User repository for user-related database operations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from .base_repository import BaseRepository
from ..core.exceptions import DatabaseError, NotFoundError


class UserRepository(BaseRepository):
    """Repository for user operations"""
    
    def __init__(self):
        super().__init__('users')
    
    def create_user(self, email: str, password_hash: str, full_name: str) -> Dict[str, Any]:
        """Create a new user"""
        try:
            user_data = {
                'email': email,
                'password_hash': password_hash,
                'full_name': full_name,
                'created_at': datetime.utcnow().isoformat(),
                'is_active': True
            }
            
            result = self.create(user_data)
            if not result:
                raise DatabaseError("Failed to create user")
            
            return result
        except Exception as e:
            raise DatabaseError(f"User creation failed: {str(e)}")
    
    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            return self.get_by_field('email', email)
        except Exception as e:
            raise DatabaseError(f"Failed to get user by email: {str(e)}")
    
    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user by user ID (returns single user in list for consistency)"""
        try:
            user = self.get_by_id(user_id)
            return [user] if user else []
        except Exception as e:
            raise DatabaseError(f"Failed to get user by ID: {str(e)}")
    
    def update_user(self, user_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user information"""
        try:
            return self.update(user_id, data)
        except Exception as e:
            raise DatabaseError(f"Failed to update user: {str(e)}")
    
    def deactivate_user(self, user_id: int) -> bool:
        """Deactivate user account"""
        try:
            self.update(user_id, {'is_active': False})
            return True
        except Exception as e:
            raise DatabaseError(f"Failed to deactivate user: {str(e)}")
    
    def check_email_exists(self, email: str) -> bool:
        """Check if email already exists"""
        try:
            user = self.get_by_email(email)
            return user is not None
        except Exception as e:
            raise DatabaseError(f"Failed to check email existence: {str(e)}")

    def update_currency_preferences(self, user_id: int, currency_preferences: Dict[str, float]) -> bool:
        """Update user's currency preferences"""
        try:
            result = self.update(user_id, {'currency_preferences': currency_preferences})
            return result is not None
        except Exception as e:
            raise DatabaseError(f"Failed to update currency preferences: {str(e)}")

    def get_currency_preferences(self, user_id: int) -> Optional[Dict[str, float]]:
        """Get user's currency preferences"""
        try:
            user = self.get_by_id(user_id)
            return user.get('currency_preferences') if user else None
        except Exception as e:
            raise DatabaseError(f"Failed to get currency preferences: {str(e)}")
