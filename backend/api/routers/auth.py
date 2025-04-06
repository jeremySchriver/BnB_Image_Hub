from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr
from backend.database.database import get_db
from backend.database.services.user_service import authenticate_user, get_user_by_id
from backend.database.services.password_reset_service import (
    create_password_reset_token,
    reset_password
)
from backend.utils.email import send_password_reset_email
from backend.database.schemas.user import UserResponse
from backend.database.models.user import User
from backend.config import settings

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Create a limiter instance
limiter = Limiter(key_func=get_remote_address)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=12)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

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
        # Verify and decode the token
        payload = verify_jwt_token(auth_token)
        
        # Get user from database
        user = get_user_by_id(db, int(payload['sub']))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        return user
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except Exception as e:
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
@limiter.limit("5/minute")  # Allow 5 login attempts per minute per IP
async def login_for_access_token(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
            
        if user.is_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is locked. Please contact administrator"
            )
            
        if user.force_password_change:
            return {
                "requires_password_change": True,
                "message": "Password change required"
            }

        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        response.set_cookie(
            key="auth_token",
            value=access_token,
            httponly=True,
            secure=False,  # Set to True in production
            samesite="lax",
            max_age=60 * 60,  # 1 hour
            path="/"
        )
        
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,  # Set to True in production
            samesite="lax",
            max_age=60 * 60 * 24 * 30,  # 30 days
            path="/auth/refresh"
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "is_superuser": user.is_superuser
        }
    except Exception as e:
        if isinstance(e, HTTPException) and e.status_code == 429:
            # Rate limit exceeded
            retry_after = 60
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many login attempts. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )
        raise e

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

@router.post("/refresh")
async def refresh_token(
    response: Response,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token"
        )
    
    try:
        payload = verify_jwt_token(refresh_token)
        user = get_user_by_id(db, int(payload['sub']))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
            
        access_token = create_access_token(data={"sub": str(user.id)})
        
        response.set_cookie(
            key="auth_token",
            value=access_token,
            httponly=True,
            secure=False,  # Set to True in production
            samesite="lax",
            max_age=60 * 60,  # 1 hour
            path="/"
        )
        
        return {"access_token": access_token}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
        
@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    token = create_password_reset_token(db, request.email)
    if token:
        reset_link = f"http://localhost:8080/reset-password?token={token}"
        await send_password_reset_email(request.email, reset_link)
    
    return {"message": "If an account exists with this email, a password reset link will be sent"}

@router.post("/reset-password")
async def handle_password_reset(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    user = reset_password(db, request.token, request.new_password)
    return {"message": "Password reset successfully"}

@router.post("/force-password-change/{user_id}")
async def force_password_change(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = get_user_by_id(db, user_id)
    user.force_password_change = True
    db.commit()
    return {"message": "User must change password on next login"}