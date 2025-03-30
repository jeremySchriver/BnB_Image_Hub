from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str
    is_active: bool = True
    is_admin: bool = False
    is_superuser: bool = False

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
    
    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    date_joined: datetime
    last_login: Optional[datetime]
    is_admin: Optional[bool]
    is_superuser: Optional[bool]

    class Config:
        from_attributes = True