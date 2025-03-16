from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.image import Image
from ..schemas.image import ImageCreate, ImageResponse
from ..services.image_service import save_image, get_image, get_images

router = APIRouter()

@router.post("/images/", response_model=ImageResponse)
async def upload_image(image: UploadFile = File(...), db: Session = next(get_db())):
    try:
        return await save_image(image, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/images/{image_id}", response_model=ImageResponse)
async def read_image(image_id: int, db: Session = next(get_db())):
    image = await get_image(image_id, db)
    if image is None:
        raise HTTPException(status_code=404, detail="Image not found")
    return image

@router.get("/images/", response_model=List[ImageResponse])
async def read_images(skip: int = 0, limit: int = 10, db: Session = next(get_db())):
    return await get_images(skip=skip, limit=limit)