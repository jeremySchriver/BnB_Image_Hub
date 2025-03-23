from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os

from backend.database.database import get_db
from backend.database.models.image import Image
from backend.database.schemas.image import ImageCreate, ImageResponse, ImageUpdate
from backend.database.services.image_service import save_image, get_image, get_all_untagged_images, get_next_untagged_image, update_image_tags


router = APIRouter(
    prefix="/images",
    tags=["images"]
)

'''Get image content from the database, including actual image file.'''
@router.get("/content/{image_id}")
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

'''Update tag method'''
@router.put("/tags/{image_id}")
def update_tags(
    image_id: int,
    update_data: ImageUpdate,
    db: Session = Depends(get_db)
):
    """Update image tags, generate thumbnail, and move to tagged storage."""
    try:
        updated_image = update_image_tags(
            db=db,
            image_id=image_id,
            tags=update_data.tags,
            author=update_data.author,
            filename=update_data.filename
        )
        
        if not updated_image:
            raise HTTPException(
                status_code=404,
                detail="Image not found"
            )
            
        return updated_image
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process image: {str(e)}"
        )

'''Untagged image page methods'''
@router.get("/untagged/full_list")
def get_untagged_list(db: Session = Depends(get_db)):
    """Get all untagged images from the database."""
    try:
        # Query untagged images directly from database
        untagged_images = get_all_untagged_images(db)
        
        # Format response
        response = []
        for image in untagged_images:
            image_data = {
                "id": str(image.id),
                "filename": image.filename,
                "tagged_full_path": None,
                "tagged_thumb_path": None,
                "untagged_full_path": image.untagged_full_path,
                "untagged_thumb_path": image.untagged_thumb_path,
                "tags": image.tags,
                "date_added": image.date_added.isoformat() if image.date_added else None,
                "author": image.author
            }
            response.append(image_data)
            
        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get untagged images list: {str(e)}"
        )
        
@router.get("/untagged/next")
def get_untagged_list(db: Session = Depends(get_db)):
    """Get all untagged images from the database."""
    try:
        # Query untagged images directly from database
        image = get_next_untagged_image(db)
        
        # Format response
        response = []
        image_data = {
            "id": str(image.id),
            "filename": image.filename,
            "tagged_full_path": None,
            "tagged_thumb_path": None,
            "untagged_full_path": image.untagged_full_path,
            "untagged_thumb_path": image.untagged_thumb_path,
            "tags": image.tags,
            "date_added": image.date_added.isoformat() if image.date_added else None,
            "author": image.author
        }
        response.append(image_data)
            
        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get untagged images list: {str(e)}"
        )