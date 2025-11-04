"""
User service layer for business logic
"""
from typing import Optional, Dict, Any
from datetime import timedelta
from ..repositories.user_repository import UserRepository
from ..core.security import SecurityManager
from ..core.exceptions import AuthenticationError, ValidationError, DatabaseError
from ..schemas.schemas import UserCreate, User


class UserService:
    """Service for user business logic"""
    
    def __init__(self):
        self.user_repo = UserRepository()
        self.security = SecurityManager()
    
    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user with validation"""
        try:
            # Check if email already exists
            if self.user_repo.check_email_exists(user_data.email):
                raise ValidationError("Email already registered")
            
            # Hash password
            password_hash = self.security.get_password_hash(user_data.password)
            
            # Create user
            db_user = self.user_repo.create_user(
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
        """Authenticate user credentials"""
        try:
            user = self.user_repo.get_by_email(email)
            if not user:
                return None
            
            if not self.security.verify_password(password, user['password_hash']):
                return None
            
            if not user.get('is_active', True):
                raise AuthenticationError("Account is inactive")
            
            return user
            
        except AuthenticationError:
            raise
        except Exception as e:
            raise DatabaseError(f"Authentication failed: {str(e)}")
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        try:
            user = self.user_repo.get_by_email(email)
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
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        try:
            users = self.user_repo.get_by_user_id(user_id)
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
        """Create access token for user"""
        return self.security.create_access_token(
            data={"sub": user['email'], "user_id": user['id']},
            expires_delta=timedelta(minutes=10080)  # 7 days
        )

    async def update_currency_preferences(self, user_id: int, currency_preferences: Dict[str, float]) -> bool:
        """Update user's currency preferences"""
        try:
            return self.user_repo.update_currency_preferences(user_id, currency_preferences)
        except Exception as e:
            raise DatabaseError(f"Failed to update currency preferences: {str(e)}")

    async def get_currency_preferences(self, user_id: int) -> Optional[Dict[str, float]]:
        """Get user's currency preferences"""
        try:
            return self.user_repo.get_currency_preferences(user_id)
        except Exception as e:
            raise DatabaseError(f"Failed to get currency preferences: {str(e)}")
