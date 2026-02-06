from typing import Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from ...schemas.schemas import UserCreate, User, Token, FirebaseLogin
from ...services.user_service import UserService
from ...core.security import SecurityManager
from ...core.exceptions import AuthenticationError, ValidationError, DatabaseError

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

ACCESS_TOKEN_EXPIRE_MINUTES = 30

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    """Register a new user"""
    try:
        user_service = UserService()
        return await user_service.create_user(user)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration"
        )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user - username field should contain email"""
    try:
        user_service = UserService()
        user = await user_service.authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = user_service.create_access_token(user)
        return {"access_token": access_token, "token_type": "bearer"}
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )

@router.post("/firebase-login", response_model=Token)
async def firebase_login(login_data: FirebaseLogin):
    """Login/Register user using Firebase ID token"""
    try:
        user_service = UserService()
        user = await user_service.authenticate_firebase_user(login_data.firebase_token)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firebase authentication failed",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = user_service.create_access_token(user)
        return {"access_token": access_token, "token_type": "bearer"}
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during Firebase login: {str(e)}"
        )

@router.get("/me", response_model=User)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user information using Firebase Token Verification"""
    try:
        # 1. Verify Firebase Token directly
        try:
            from firebase_admin import auth as firebase_auth
            decoded_token = firebase_auth.verify_id_token(token)
            email = decoded_token.get('email')
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Firebase token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain an email",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 2. Get User from Local DB (Sync)
        user_service = UserService()
        user = await user_service.get_user_by_email(email)
        
        # If user exists in Firebase but not in local DB (edge case), create them
        if not user:
             # Extract extra info given we know the token is valid
            name = decoded_token.get('name', email.split('@')[0])
            uid = decoded_token.get('uid')
            
            # Using a simplified create without password since it's Firebase managed
            # We treat the UserService.create_user typically for local auth, 
            # but here we reuse the repository logic via service for consistency
            from ...repositories.user_repository import UserRepository
            repo = UserRepository()
            
            # Create a dummy password hash just to satisfy DB constraints if any
            # In a pure Firebase setup, we might not even need this column
            import secrets
            # We don't need robust hashing here since it's never used for login
            dummy_hash = "firebase_managed_user" 
            
            db_user = await repo.create_user(
                email=email,
                password_hash=dummy_hash,
                full_name=name,
                uid=uid
            )
            
            # Return as User schema
            user = User(
                id=db_user['id'],
                email=db_user['email'],
                full_name=db_user['full_name'],
                is_active=db_user.get('is_active', True),
                created_at=db_user['created_at']
            )

        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching user data"
        )

async def get_current_user_optional(token: str = Depends(oauth2_scheme)):
    """Get current user information from Firebase token, but don't fail if no token"""
    try:
        from firebase_admin import auth as firebase_auth
        decoded_token = firebase_auth.verify_id_token(token)
        email = decoded_token.get('email')
        
        if not email:
            return None

        user_service = UserService()
        user = await user_service.get_user_by_email(email)
        return user
    except Exception:
        return None

@router.get("/currency-preferences")
async def get_currency_preferences(current_user: User = Depends(get_current_user)):
    """Get user's currency preferences"""
    try:
        user_service = UserService()
        preferences = await user_service.get_currency_preferences(current_user.id)
        return {"success": True, "preferences": preferences or {}}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get currency preferences: {str(e)}"
        )

@router.put("/currency-preferences")
async def update_currency_preferences(
    preferences: Dict[str, float],
    current_user: User = Depends(get_current_user)
):
    """Update user's currency preferences"""
    try:
        user_service = UserService()
        success = await user_service.update_currency_preferences(current_user.id, preferences)
        if success:
            return {"success": True, "message": "Currency preferences updated"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update currency preferences"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update currency preferences: {str(e)}"
        )
