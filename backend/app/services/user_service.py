"""
User service layer for business logic
"""
from firebase_admin import auth as firebase_auth
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from ..repositories.user_repository import UserRepository
from ..core.security import SecurityManager
from ..core.exceptions import AuthenticationError, ValidationError, DatabaseError
from ..schemas.schemas import UserCreate, User


class UserService:
    """Service for user business logic (Firebase Auth Integration)"""
    
    def __init__(self):
        self.user_repo = UserRepository()
        # self.security = SecurityManager() # Removed

    async def authenticate_firebase_user(self, firebase_token: str) -> Optional[Dict[str, Any]]:
        """authenticate user using Firebase ID token (Legacy/Direct Endpoint)"""
        try:
            # Verify the token
            decoded_token = firebase_auth.verify_id_token(firebase_token)
            email = decoded_token.get('email')
            name = decoded_token.get('name', email.split('@')[0])
            uid = decoded_token.get('uid')
            
            if not email:
                raise AuthenticationError("Invalid Firebase token: no email found")
                
            # Check if user exists in our local DB
            user = await self.user_repo.get_by_email(email)
            
            if not user:
                # Create user automatically if it's their first time via Google/Firebase
                # We use a placeholder hash because auth is handled by Firebase
                password_hash = "firebase_managed_account"
                
                user = await self.user_repo.create_user(
                    email=email,
                    password_hash=password_hash,
                    full_name=name,
                    uid=uid
                )
            
            if not user.get('is_active', True):
                raise AuthenticationError("Account is inactive")
                
            return user
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            if isinstance(e, AuthenticationError):
                raise
            logger.error(f"Unexpected Error in firebase_auth: {str(e)}")
            raise AuthenticationError(f"Firebase authentication failed: {str(e)}")
    
    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user with validation (Manual Registration Fallback)"""
        try:
            # Check if email already exists
            if await self.user_repo.check_email_exists(user_data.email):
                raise ValidationError("Email already registered")
            
            # Placeholder hash since we expect Firebase to handle this in real flow
            # Or if this is for admin seeding
            password_hash = "manual_registration_placeholder" 
            
            # Create user
            db_user = await self.user_repo.create_user(
                email=user_data.email,
                password_hash=password_hash,
                full_name=user_data.full_name
            )
            
            if not db_user:
                raise DatabaseError("Failed to create user")
            
            return User(
                id=db_user['id'],
                email=db_user['email'],
                full_name=db_user['full_name'],
                is_active=db_user.get('is_active', True),
                created_at=db_user['created_at']
            )
            
        except ValidationError:
            raise
        except Exception as e:
            raise DatabaseError(f"User creation failed: {str(e)}")
    
    async def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user credentials (Legacy email/password login)"""
        try:
            user = await self.user_repo.get_by_email(email)
            if not user:
                return None
            
            # For Firebase-managed accounts, reject password login
            if user.get('password_hash') == 'firebase_managed_account':
                raise AuthenticationError("This account uses Google Sign-In. Please use 'Continue with Google'.")
            
            # For manual accounts with placeholder, also reject
            if user.get('password_hash') == 'manual_registration_placeholder':
                raise AuthenticationError("Password authentication not configured for this account.")
            
            # If we had real password hashing, we'd verify here
            # For now, we don't support traditional password login
            raise AuthenticationError("Traditional password login is disabled. Please use Google Sign-In.")
            
        except AuthenticationError:
            raise
        except Exception as e:
            raise DatabaseError(f"Authentication failed: {str(e)}")
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        try:
            user = await self.user_repo.get_by_email(email)
            if not user:
                return None
            
            return User(
                id=user['id'],
                email=user['email'],
                full_name=user['full_name'],
                is_active=user.get('is_active', True),
                created_at=user['created_at']
            )
        except Exception as e:
            raise DatabaseError(f"Failed to get user: {str(e)}")
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        try:
            users = await self.user_repo.get_by_user_id(user_id)
            if not users:
                return None
            
            user = users[0]
            return User(
                id=user['id'],
                email=user['email'],
                full_name=user['full_name'],
                is_active=user.get('is_active', True),
                created_at=user['created_at']
            )
        except Exception as e:
            raise DatabaseError(f"Failed to get user: {str(e)}")
    
    def create_access_token(self, user: Dict[str, Any]) -> str:
        """
        Create access token for user (Firebase-compatible wrapper)
        Note: In pure Firebase setup, frontend uses Firebase tokens directly.
        This is kept for backward compatibility with legacy endpoints.
        """
        from firebase_admin import auth as firebase_auth
        from datetime import timedelta
        
        # For Firebase users, we create a custom token
        # The frontend should ideally use Firebase ID tokens instead
        try:
            # Create a custom Firebase token
            custom_token = firebase_auth.create_custom_token(user.get('uid', user['email']))
            return custom_token.decode('utf-8')
        except Exception as e:
            # Fallback: return a simple identifier (not for production)
            print(f"Warning: Could not create Firebase token: {e}")
            return f"firebase_user_{user['id']}"


    async def update_currency_preferences(self, user_id: str, currency_preferences: Dict[str, float]) -> bool:
        """Update user's currency preferences"""
        try:
            return await self.user_repo.update_currency_preferences(user_id, currency_preferences)
        except Exception as e:
            raise DatabaseError(f"Failed to update currency preferences: {str(e)}")

    async def get_currency_preferences(self, user_id: str) -> Optional[Dict[str, float]]:
        """Get user's currency preferences"""
        try:
            return await self.user_repo.get_currency_preferences(user_id)
        except Exception as e:
            raise DatabaseError(f"Failed to get currency preferences: {str(e)}")
