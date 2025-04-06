from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str
    is_active: bool = True
    is_admin: bool = False
    is_superuser: bool = False
    is_locked: bool = False
    force_password_change: bool = False
    password_reset_token: str = None
    password_reset_expires: datetime = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    currentPassword: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None 
    is_superuser: Optional[bool] = None 
    is_locked: Optional[bool] = None
    force_password_change: bool = False
    password_reset_token: Optional[str] = None
    password_reset_expires: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    date_joined: datetime
    last_login: Optional[datetime]
    is_admin: Optional[bool]
    is_superuser: Optional[bool]
    is_locked: Optional[bool]
    force_password_change: Optional[bool]
    password_reset_token: Optional[str]
    password_reset_expires: Optional[datetime]


    class Config:
        from_attributes = True