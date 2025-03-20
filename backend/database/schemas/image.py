from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ImageCreate(BaseModel):
    filename: str
    tagged_full_path: Optional[str] = None
    tagged_thumb_path: Optional[str] = None
    untagged_full_path: Optional[str] = None
    untagged_thumb_path: Optional[str] = None
    tags: Optional[List[str]] = []
    author: Optional[str] = None

class ImageResponse(BaseModel):
    id: int
    filename: str
    tagged_full_path: Optional[str] = None
    tagged_thumb_path: Optional[str] = None
    untagged_full_path: Optional[str] = None
    untagged_thumb_path: Optional[str] = None
    tags: List[str]
    date_added: datetime
    author: Optional[str] = None

    class Config:
        from_attributes = True