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

async def get_current_user(
    db: Session = Depends(get_db),
    auth_token: Optional[str] = Cookie(None)
) -> User:
    print(f"Debug - Received auth token: {auth_token[:20]}...") # Debug line
    
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated - no token"
        )

    try:
        payload = jwt.decode(
            auth_token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        print(f"Debug - JWT payload: {payload}")  # Debug line
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token contents"
            )
            
        user = db.query(User).filter(User.id == user_id).first()
        print(f"Debug - Found user: {user.email if user else 'None'}")  # Debug line
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
            
        return user
        
    except JWTError as e:
        print(f"Debug - JWT decode error: {str(e)}")  # Debug line
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}"
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