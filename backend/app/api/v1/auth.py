from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from ...schemas.schemas import UserCreate, User, Token
from ...services.user_service import UserService
from ...core.security import SecurityManager
from ...core.exceptions import AuthenticationError, ValidationError, DatabaseError, NotFoundError

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

ACCESS_TOKEN_EXPIRE_MINUTES = 30

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    """Register a new user"""
    user_service = UserService()
    return await user_service.create_user(user)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user - username field should contain email"""
    user_service = UserService()
    user = await user_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise AuthenticationError(
            message="Incorrect email or password",
            context="User authentication",
            details={"email": form_data.username}
        )

    access_token = user_service.create_access_token(user)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user information"""
    security = SecurityManager()
    email = security.verify_token(token)
    if not email:
        raise AuthenticationError(
            message="Could not validate credentials",
            context="Token validation",
            details={"token_provided": True}
        )

    user_service = UserService()
    user = await user_service.get_user_by_email(email)
    if not user:
        raise NotFoundError(
            resource_type="User",
            resource_id=email,
            context="Get user profile",
            details={"email": email}
        )

    return user

async def get_current_user_optional(token: str = Depends(oauth2_scheme)):
    """Get current user information, but don't fail if no token"""
    try:
        security = SecurityManager()
        email = security.verify_token(token)
        if not email:
            return None

        user_service = UserService()
        user = await user_service.get_user_by_email(email)
        return user
    except Exception:
        return None
