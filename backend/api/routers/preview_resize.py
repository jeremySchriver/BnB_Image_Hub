from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from PIL import Image
import io
import os
from fastapi.responses import StreamingResponse

from backend.database.database import get_db
from backend.database.services.image_service import get_image

import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/preview",
    tags=["preview"]
)

@router.get("/untagged/preview/{image_id}")
async def get_untagged_preview(image_id: int, max_size: int = 800, db: Session = Depends(get_db)):
    """Get a resized preview of an untagged image."""
    image = get_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    file_path = image.untagged_full_path
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image file not found")

    try:
        with Image.open(file_path) as img:
            # Convert RGBA/P images to RGB
            if img.mode in ('RGBA', 'P'):
                # Use white background for transparency
                background = Image.new('RGB', img.size, 'white')
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[3])  # Use alpha channel as mask
                else:
                    background.paste(img)
                img = background

            # Calculate new size maintaining aspect ratio
            width, height = img.size
            ratio = min(max_size/width, max_size/height)
            new_size = (int(width * ratio), int(height * ratio))
            
            # Only resize if image is larger than max_size
            if ratio < 1:
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Save to bytes
            img_byte_arr = io.BytesIO()
            
            # Determine output format
            output_format = img.format or 'JPEG'
            if output_format.upper() not in ('JPEG', 'PNG', 'WEBP'):
                output_format = 'JPEG'

            save_params = {
                'format': output_format,
                'quality': 85,
            }
            
            # Remove alpha channel parameters for JPEG
            if output_format == 'JPEG':
                save_params['optimize'] = True
            elif output_format in ('PNG', 'WEBP'):
                save_params['optimize'] = True
                if img.mode == 'RGBA':
                    save_params['alpha'] = True

            img.save(img_byte_arr, **save_params)
            img_byte_arr.seek(0)
            
            return StreamingResponse(
                img_byte_arr,
                media_type=f"image/{output_format.lower()}"
            )
            
    except Exception as e:
        logger.error(f"Error processing image {image_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )