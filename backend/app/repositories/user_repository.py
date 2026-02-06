"""
User repository for user-related database operations using MongoDB
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from .base_repository import BaseRepository
from ..core.exceptions import DatabaseError, NotFoundError


class UserRepository(BaseRepository):
    """Repository for user operations with MongoDB"""
    
    def __init__(self):
        super().__init__('users')
    
    async def create_user(self, email: str, full_name: str, password_hash: str = None, uid: str = None) -> Dict[str, Any]:
        """
        Create a new user.
        If uid is provided (from Firebase Auth), use it as _id.
        """
        try:
            user_data = {
                'email': email,
                'full_name': full_name,
                'created_at': datetime.utcnow().isoformat(),
                'is_active': True
            }
            
            if password_hash:
                user_data['password_hash'] = password_hash
            
            return await self.create(user_data, doc_id=uid)
        except Exception as e:
            raise DatabaseError(f"User creation failed: {str(e)}")
    
    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            return await self.get_by_field('email', email)
        except Exception as e:
            raise DatabaseError(f"Failed to get user by email: {str(e)}")
    
    async def get_by_user_id(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user by user ID (returns single user in list for consistency)"""
        try:
            user = await self.get_by_id(user_id)
            return [user] if user else []
        except Exception as e:
            raise DatabaseError(f"Failed to get user by ID: {str(e)}")
    
    async def update_user(self, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user information"""
        try:
            return await self.update(user_id, data)
        except Exception as e:
            raise DatabaseError(f"Failed to update user: {str(e)}")
    
    async def deactivate_user(self, user_id: str) -> bool:
        """Deactivate user account"""
        try:
            await self.update(user_id, {'is_active': False})
            return True
        except Exception as e:
            raise DatabaseError(f"Failed to deactivate user: {str(e)}")
    
    async def check_email_exists(self, email: str) -> bool:
        """Check if email already exists"""
        try:
            user = await self.get_by_email(email)
            return user is not None
        except Exception as e:
            raise DatabaseError(f"Failed to check email existence: {str(e)}")

    async def update_currency_preferences(self, user_id: str, currency_preferences: Dict[str, float]) -> bool:
        """Update user's currency preferences"""
        try:
            result = await self.update(user_id, {'currency_preferences': currency_preferences})
            return result is not None
        except Exception as e:
            raise DatabaseError(f"Failed to update currency preferences: {str(e)}")

    async def get_currency_preferences(self, user_id: str) -> Optional[Dict[str, float]]:
        """Get user's currency preferences"""
        try:
            user = await self.get_by_id(user_id)
            return user.get('currency_preferences') if user else None
        except Exception as e:
            raise DatabaseError(f"Failed to get currency preferences: {str(e)}")
