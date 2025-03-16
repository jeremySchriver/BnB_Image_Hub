from pydantic import BaseModel
from typing import Optional

class ImageCreate(BaseModel):
    filename: str
    path: str
    description: Optional[str] = None

class ImageResponse(BaseModel):
    id: int
    filename: str
    path: str
    description: Optional[str] = None

    class Config:
        orm_mode = True