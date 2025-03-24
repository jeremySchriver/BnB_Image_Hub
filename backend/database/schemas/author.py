from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class AuthorBase(BaseModel):
    name: str
    email: EmailStr

class AuthorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    
class AuthorCreate(AuthorBase):
    name: str
    email: EmailStr

class AuthorResponse(AuthorBase):
    id: int
    name: str
    email: EmailStr
    date_added: datetime

    class Config:
        from_attributes = True