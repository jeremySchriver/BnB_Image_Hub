from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from backend.database.database import get_db
from backend.database.models.image import Image
from backend.database.schemas.image import ImageCreate, ImageResponse
from backend.database.services.image_service import save_image, get_image, get_untagged_images_fromDB

import os

router = APIRouter(
    prefix="/images",
    tags=["images"]
)

@router.get("/untagged", response_model=List[ImageResponse])
async def get_untagged_images(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get a list of untagged images from the database."""
    try:
        # Query images that have untagged_full_path set but no tags
        images = get_untagged_images_fromDB(db, limit=limit)
        
        # Convert to response format
        return [
            ImageResponse(
                id=str(image.id),
                filename=image.filename,
                file_size=os.path.getsize(image.untagged_full_path) if image.untagged_full_path else 0,
                file_type=os.path.splitext(image.filename)[1].lower(),
                upload_date=image.date_added.timestamp(),
                url=f"/api/images/{image.id}/content",
                tags=[],
                author=image.author or ""
            ) for image in images
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get untagged images: {str(e)}"
        )

@router.get("/{image_id}/content")
async def get_image_content(
    image_id: int,
    db: Session = Depends(get_db)
):
    """Serve the actual image file content."""
    try:
        image = get_image(db, image_id)
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
            
        file_path = image.untagged_full_path or image.tagged_full_path
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Image file not found")
            
        return FileResponse(
            file_path,
            media_type=f"image/{os.path.splitext(image.filename)[1][1:]}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get image content: {str(e)}"
        )
