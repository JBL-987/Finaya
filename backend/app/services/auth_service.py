from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..core.config import settings
from ..core.database import get_supabase_client
from ..schemas.schemas import UserCreate, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password, ensuring max 72 bytes for bcrypt."""
    password = password[:72]  # Truncate to 72 characters
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None

async def authenticate_user(email: str, password: str):
    """Authenticate user credentials using Supabase"""
    supabase = get_supabase_client()
    try:
        # Query user by email
        response = supabase.table('users').select('*').eq('email', email).execute()
        if not response.data:
            return None

        user_data = response.data[0]
        if not verify_password(password, user_data['password_hash']):
            return None

        return user_data
    except Exception as e:
        print(f"Authentication error: {e}")
        return None

async def create_user(user: UserCreate):
    """Create a new user in Supabase"""
    supabase = get_supabase_client()
    try:
        user_data = {
            'email': user.email,
            'password_hash': get_password_hash(user.password),
            'full_name': user.full_name,
            'created_at': datetime.utcnow().isoformat(),
            'is_active': True
        }

        response = supabase.table('users').insert(user_data).execute()
        if response.data:
            user_obj = response.data[0]

            # Create default financial goals for the new user
            try:
                # Set deadline to 1 year from now
                deadline = (datetime.utcnow() + timedelta(days=365)).isoformat()

                default_goals = [
                    {
                        'user_id': user_obj['id'],
                        'name': 'Emergency Fund',
                        'target_amount': 6000.0,  # 6 months of expenses
                        'current_amount': 0.0,
                        'deadline': deadline
                    },
                    {
                        'user_id': user_obj['id'],
                        'name': 'Savings Rate Target',
                        'target_amount': 20.0,  # 20% savings rate
                        'current_amount': 0.0,
                        'deadline': deadline
                    },
                    {
                        'user_id': user_obj['id'],
                        'name': 'Debt Reduction',
                        'target_amount': 0.0,  # Target to reduce debt to zero
                        'current_amount': 0.0,
                        'deadline': deadline
                    }
                ]

                supabase.table('financial_goals').insert(default_goals).execute()
                print(f"Created default financial goals for user {user_obj['id']}")
            except Exception as goal_error:
                print(f"Warning: Could not create default goals for user {user_obj['id']}: {goal_error}")

            return user_obj
        return None
    except Exception as e:
        print(f"User creation error: {e}")
        return None

async def get_user_by_email(email: str):
    """Get user by email"""
    supabase = get_supabase_client()
    try:
        response = supabase.table('users').select('*').eq('email', email).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Get user error: {e}")
        return None
