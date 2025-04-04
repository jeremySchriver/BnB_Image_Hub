from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional

from backend.database.database import get_db
from backend.database.services.user_service import authenticate_user, get_user_by_id
from backend.database.schemas.user import UserResponse
from backend.database.models.user import User
from backend.config import settings

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_jwt_token(token: str) -> dict:
    """
    Verify and decode a JWT token
    
    Args:
        token: The JWT token to verify
        
    Returns:
        dict: The decoded token payload
        
    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise JWTError(f"Failed to decode token: {str(e)}")

async def get_current_user(auth_token: str = Cookie(None), db: Session = Depends(get_db)) -> User:
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        # Debug logging (optional)
        print(f"Debug - Received auth token: {auth_token[:20]}...")
        
        # Verify and decode the token
        payload = verify_jwt_token(auth_token)
        print(f"Debug - JWT payload: {payload}")
        
        # Get user from database
        user = get_user_by_id(db, int(payload['sub']))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
            
        print(f"Debug - Found user: {user.email}")
        return user
        
    except JWTError as e:
        print(f"Debug - JWT Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )
    except Exception as e:
        print(f"Debug - Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication"
        )

@router.post("/token")
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production
        samesite="lax",
        path="/"
    )

    return {"status": "success"}

@router.post("/login")
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    
    # Set strict cookie settings
    response.set_cookie(
        key="auth_token",
        value=f"{access_token}",  # Ensure token is a string
        httponly=True,
        secure=False,  # False for development, True for production
        samesite="lax",
        max_age=60 * 60 * 24,  # 24 hours
        path="/"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_superuser": user.is_superuser
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="auth_token",
        httponly=True,
        secure=True,
        samesite="lax",
        path="/"
    )
    return {"status": "success"}

@router.get("/me", response_model=UserResponse)
async def get_current_auth_user(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return current_user