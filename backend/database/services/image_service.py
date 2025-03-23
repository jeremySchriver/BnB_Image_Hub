from sqlalchemy.orm import Session
from fastapi import UploadFile, File
from ..models.image import Image
from ..schemas.image import ImageCreate
from ...processor.thumbnail_generator import generate_thumbnail
from typing import List, Optional
import os
import shutil


'''Tag methods'''
def _convert_tags_to_string(tags: List[str]) -> str:
    """Convert a list of tags to a comma-separated string."""
    if not tags:
        return ""
    # Remove empty tags and strip whitespace
    cleaned_tags = [tag.strip().lower() for tag in tags if tag.strip()]
    # Remove duplicates while preserving order
    unique_tags = list(dict.fromkeys(cleaned_tags))
    return ','.join(unique_tags)

def _convert_string_to_tags(tags_string: str) -> List[str]:
    """Convert a comma-separated string to a list of tags."""
    if not tags_string:
        return []
    # Split by comma, strip whitespace, and filter out empty tags
    return [tag.strip().lower() for tag in tags_string.split(',') if tag.strip()]

def update_image_tags(
    db: Session, 
    image_id: int, 
    tags: List[str], 
    author: Optional[str] = None
) -> Optional[Image]:
    """Update image tags and move the image to tagged storage."""
    try:
        # Get image record
        image = get_image(db, image_id)
        if not image:
            return None

        # 1. Update tags
        tags_string = _convert_tags_to_string(tags)
        image.tags = tags_string
        
        # 2. Update author if provided
        if author is not None:
            image.author = author.strip()
        
        # Get the untagged path to work with
        untagged_path = image.untagged_full_path
        
        # 3. Generate new paths by simple string replacement
        tagged_path = untagged_path.replace('un-tagged', 'tagged')
        thumbnail_path = untagged_path.replace('un-tagged', 'thumbnails')
        
        # Ensure directories exist
        os.makedirs(os.path.dirname(tagged_path), exist_ok=True)
        os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)
        
        # 4. Generate and save thumbnail
        if generate_thumbnail(untagged_path, thumbnail_path):
            image.tagged_thumb_path = thumbnail_path
            
        # 5. Move original image to tagged folder
        shutil.move(untagged_path, tagged_path)
        image.tagged_full_path = tagged_path
        
        # 6. Clear untagged paths
        image.untagged_full_path = None
        image.untagged_thumb_path = None
        
        # Commit changes
        db.commit()
        db.refresh(image)
        
        return image
        
    except Exception as e:
        db.rollback()
        # Clean up any partially created files if there was an error
        if 'thumbnail_path' in locals() and os.path.exists(thumbnail_path):
            os.remove(thumbnail_path)
        if 'tagged_path' in locals() and os.path.exists(tagged_path):
            os.remove(tagged_path)
        raise e

'''File path update methods'''
def update_image_paths(
    db: Session, 
    image_id: int, 
    tagged_full_path: Optional[str] = None,
    tagged_thumb_path: Optional[str] = None
):
    image = get_image(db, image_id)
    if image:
        if tagged_full_path:
            image.tagged_full_path = tagged_full_path
        if tagged_thumb_path:
            image.tagged_thumb_path = tagged_thumb_path
        db.commit()
        db.refresh(image)
    return image

'''Store images in the database'''
def create_image(db: Session, image_data: ImageCreate):
    image = Image(
        filename=image_data.filename,
        tagged_full_path=image_data.tagged_full_path,
        tagged_thumb_path=image_data.tagged_thumb_path,
        untagged_full_path=image_data.untagged_full_path,
        untagged_thumb_path=image_data.untagged_thumb_path,
        tags=_convert_tags_to_string(image_data.tags),
        author=image_data.author
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image

def save_image(db: Session, file: UploadFile, author: Optional[str] = None):
    image = Image(
        filename=file.filename,
        untagged_full_path=f"images/full/{file.filename}",
        untagged_thumb_path=f"images/thumbs/{file.filename}",
        author=author
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image

'''Get image information from the database'''
def get_image(db: Session, image_id: int):
    return db.query(Image).filter(Image.id == image_id).first()

def list_images(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Image).offset(skip).limit(limit).all()

def get_all_untagged_images(db: Session):
    """Get all images that have no tags but have an untagged path."""
    return db.query(Image).filter((Image.untagged_full_path != False) and (Image.tags == "")).all()

def get_next_untagged_image(db: Session):
    """Get all images that have no tags but have an untagged path."""
    return db.query(Image).filter((Image.untagged_full_path != False) and (Image.tags == "")).first()

def get_images_by_tags(db: Session, tags: List[str], skip: int = 0, limit: int = 100):
    """Get images that contain all specified tags."""
    if not tags:
        return []
        
    # Convert tags to lowercase for case-insensitive search
    search_tags = [tag.lower() for tag in tags]
    
    # Build query
    query = db.query(Image)
    for tag in search_tags:
        query = query.filter(Image.tags.like(f'%{tag}%'))
    
    return query.offset(skip).limit(limit).all()

'''Deletion methods'''
def delete_image(db: Session, image_id: int):
    image = db.query(Image).filter(Image.id == image_id).first()
    if image:
        db.delete(image)
        db.commit()
    return image

'''Seed constant data into the database'''    
def cast_constant_to_db(db: Session, image_data: ImageCreate) -> Image:
    db_image = Image(
        filename=image_data.filename,
        tagged_full_path=image_data.tagged_full_path,
        tagged_thumb_path=image_data.tagged_thumb_path,
        untagged_full_path=image_data.untagged_full_path,
        untagged_thumb_path=image_data.untagged_thumb_path,
        tags=_convert_tags_to_string(image_data.tags) if image_data.tags else '',
        author=image_data.author
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image