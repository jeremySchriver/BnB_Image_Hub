from sqlalchemy.orm import Session
import io
import os
from PIL import Image as PILImage
from typing import Optional
from backend.database.models.image import Image
from backend.utils.storage_interface import get_storage_provider
import logging

logger = logging.getLogger(__name__)

storage = get_storage_provider()

def resize_image(img: PILImage.Image, max_size: int) -> PILImage.Image:
    """Resize image maintaining aspect ratio"""
    ratio = min(max_size/float(img.size[0]), max_size/float(img.size[1]))
    new_size = tuple(int(dim * ratio) for dim in img.size)
    return img.resize(new_size, PILImage.LANCZOS)

async def generate_preview(image_id: int, db: Session) -> Optional[str]:
    """Generate preview images and return success status"""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        print(f"No image found with ID {image_id}")  # Direct console output for debugging
        return None

    try:
        # Extract filename without extension for preview paths
        base_filename = os.path.splitext(image.filename)[0]
        
        # Download original image from storage
        print(f"Downloading original image: {image.untagged_full_path}")  # Debug print
        original_file_data = storage.download_file(image.untagged_full_path)
        if not original_file_data:
            print(f"Could not download original file: {image.untagged_full_path}")  # Debug print
            return None

        # Process the image
        img = PILImage.open(io.BytesIO(original_file_data))
        
        # Convert RGBA/P images to RGB with white background
        if img.mode in ('RGBA', 'P'):
            background = PILImage.new('RGB', img.size, 'white')
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[3])
            else:
                background.paste(img)
            img = background

        # Generate and upload search preview (300px)
        search_preview = resize_image(img, max_size=300)
        search_preview_buffer = io.BytesIO()
        search_preview.save(search_preview_buffer, format='JPEG', quality=85, optimize=True)
        search_preview_buffer.seek(0)
        
        # Generate and upload tag preview (800px)
        tag_preview = resize_image(img, max_size=800)
        tag_preview_buffer = io.BytesIO()
        tag_preview.save(tag_preview_buffer, format='JPEG', quality=85, optimize=True)
        tag_preview_buffer.seek(0)

        try:
            # Upload search preview to B2 with explicit file naming
            search_preview_path = f"search_preview/{base_filename}.jpg"
            print(f"Uploading search preview to: {search_preview_path}")  # Debug print
            search_preview_url = storage.upload_file(
                search_preview_buffer,
                search_preview_path,
                "image/jpeg"
            )

            # Upload tag preview to B2 with explicit file naming
            tag_preview_path = f"tag_preview/{base_filename}.jpg"
            print(f"Uploading tag preview to: {tag_preview_path}")  # Debug print
            tag_preview_url = storage.upload_file(
                tag_preview_buffer,
                tag_preview_path,
                "image/jpeg"
            )

            # Store the full URLs in database
            image.search_preview_path = search_preview_url  # Use the full URL returned by B2
            image.tag_preview_path = tag_preview_url       # Use the full URL returned by B2
            db.commit()
            
            print(f"Successfully uploaded previews for image {image_id}")  # Debug print
            return True

        except Exception as e:
            print(f"Failed to upload previews: {str(e)}")  # Debug print
            return None

    except Exception as e:
        print(f"Error generating preview for image {image_id}: {str(e)}")  # Debug print
        return None