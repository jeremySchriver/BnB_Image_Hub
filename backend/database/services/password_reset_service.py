from datetime import datetime, timedelta
import secrets
from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models.user import User
from .user_service import get_user_by_email, get_password_hash

def generate_password_reset_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)

def create_password_reset_token(db: Session, email: str) -> str:
    user = get_user_by_email(db, email)
    if not user:
        # Still return success to prevent email enumeration
        return None
    
    token = generate_password_reset_token()
    expires = datetime.utcnow() + timedelta(hours=24)
    
    user.password_reset_token = token
    user.password_reset_expires = expires
    db.commit()
    
    return token

def validate_reset_token(db: Session, token: str) -> User:
    user = db.query(User).filter(
        User.password_reset_token == token,
        User.password_reset_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    return user

def reset_password(db: Session, token: str, new_password: str) -> User:
    user = validate_reset_token(db, token)
    
    user.hashed_password = get_password_hash(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.force_password_change = False
    
    db.commit()
    return user