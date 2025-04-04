from sqlalchemy.orm import Session
from fastapi import HTTPException
from passlib.context import CryptContext
from ..models.user import User
from ..schemas.user import UserCreate, UserUpdate
from datetime import datetime
import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    # Convert the password string to bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return the hash as a string
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Convert passwords to bytes for comparison
    plain_password_bytes = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)
    except ValueError:
        return False

def create_user(db: Session, user_data: UserCreate) -> User:
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        is_active=True,
        is_admin=user_data.is_admin,
        is_superuser=user_data.is_superuser  
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    
    user.last_login = datetime.utcnow()
    db.commit()
    return user

def get_user_by_id(db: Session, user_id: int) -> User:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> User:
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str) -> User:
    return db.query(User).filter(User.email == email).first()

def update_user(db: Session, user_id: int, update_data: dict) -> User:
    try:
        user = get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Handle password update
        if 'password' in update_data:
            user.hashed_password = get_password_hash(update_data['password'])
            del update_data['password']

        # Update other fields
        for field, value in update_data.items():
            if hasattr(user, field) and value is not None:
                setattr(user, field, value)

        db.commit()
        db.refresh(user)
        return user

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

def add_super_user(db: Session, email: str) -> User:
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with email {email} not found")
    
    user.is_superuser = True
    db.commit()
    db.refresh(user)
    return user

def remove_super_user(db: Session, email: str) -> User:
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with email {email} not found")
    
    user.is_superuser = False
    db.commit()
    db.refresh(user)
    return user

def add_admin_flag(db: Session, email: str) -> User:
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with email {email} not found")
    
    user.is_admin = True
    db.commit()
    db.refresh(user)
    return user

def remove_admim_flag(db: Session, email: str) -> User:
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with email {email} not found")
    
    user.is_admin = False
    db.commit()
    db.refresh(user)
    return user