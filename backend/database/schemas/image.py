from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .tag import TagResponse
from .author import AuthorResponse

class ImageCreate(BaseModel):
    filename: str
    tagged_full_path: Optional[str] = None
    tagged_thumb_path: Optional[str] = None
    untagged_full_path: Optional[str] = None
    untagged_thumb_path: Optional[str] = None
    tag_ids: Optional[List[str]] = []
    author_id: Optional[int] = None

class ImageResponse(BaseModel):
    id: int
    filename: str
    tagged_full_path: Optional[str] = None
    tagged_thumb_path: Optional[str] = None
    untagged_full_path: Optional[str] = None
    untagged_thumb_path: Optional[str] = None
    tags: List[TagResponse]
    date_added: datetime
    author: Optional[AuthorResponse] = None

    class Config:
        from_attributes = True
        
class ImageUpdate(BaseModel):
    tag_ids: List[str]
    author_id: Optional[str] = None
    filename: Optional[str] = None

    class Config:
        from_attributes = True