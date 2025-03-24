from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TagBase(BaseModel):
    name: str

class TagUpdate(BaseModel):
    name: Optional[str] = None

class TagCreate(TagBase):
    name: str

class TagResponse(TagBase):
    id: int
    name: str
    date_added: datetime

    class Config:
        from_attributes = True