from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .tag import TagResponse
from .author import AuthorResponse

class ImageCreate(BaseModel):
    filename: str
    tagged_full_path: Optional[str] = None
    search_preview_path: Optional[str] = None
    tag_preview_path: Optional[str] = None
    untagged_full_path: Optional[str] = None
    tags: Optional[List[str]] = []
    author: Optional[str] = None

    class Config:
        from_attributes = True

class ImageResponse(BaseModel):
    id: int
    filename: str
    tagged_full_path: Optional[str] = None
    search_preview_path: Optional[str] = None
    tag_preview_path: Optional[str] = None
    untagged_full_path: Optional[str] = None
    tags: List[TagResponse]
    date_added: datetime
    author: Optional[AuthorResponse] = None

    class Config:
        from_attributes = True
        
class ImageUpdate(BaseModel):
    tags: List[str]  # Change from tag_ids to tags
    author: Optional[str] = None  # Change from author_id to author
    filename: Optional[str] = None

    class Config:
        from_attributes = True