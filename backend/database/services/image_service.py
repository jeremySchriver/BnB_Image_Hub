from sqlalchemy.orm import Session
from fastapi import UploadFile, File
from ..models.image import Image
from ..schemas.image import ImageCreate
from ...processor.thumbnail_generator import generate_thumbnail
from typing import List, Optional
import os
import shutil
import time
import random
import string
from datetime import datetime
from pathlib import Path


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

'''Filename operations'''
def _generate_hash_filename(original_filename: str) -> str:
    """Generate a unique 24-character hash filename while preserving extension."""
    # Get current timestamp with microseconds
    current_time = datetime.now()
    timestamp = current_time.strftime("%Y%m%d%H%M%S")
    
    # Create seed from microseconds
    seed = int(current_time.microsecond)
    random.seed(seed)
    
    # Generate 10 random characters using the time-based seed
    random_chars = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    
    # Reset the random seed to avoid affecting other random operations
    random.seed()
    
    # Get original file extension
    extension = Path(original_filename).suffix
    
    # Combine timestamp and random chars
    return f"{timestamp}-{random_chars}{extension}"

def update_image_tags(
    db: Session, 
    image_id: int, 
    tags: List[str], 
    author: Optional[str] = None,
    filename: Optional[str] = None
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
        
        # Get the original filename to work with
        original_filename = os.path.basename(untagged_path)
        
        # 3. Generate new hashed filename
        hashed_filename = _generate_hash_filename(original_filename)
        
        # 4. Update the filename in the database to match the hashed name
        image.filename = hashed_filename
        
        # 5. Generate new paths with hashed filename       
        tagged_dir = os.path.join(os.path.dirname(untagged_path).replace('un-tagged', 'tagged'))
        thumbnail_dir = os.path.join(os.path.dirname(untagged_path).replace('un-tagged', 'thumbnails'))
        
        tagged_path = os.path.join(tagged_dir, hashed_filename)
        thumbnail_path = os.path.join(thumbnail_dir, hashed_filename)
        
        # Ensure directories exist
        os.makedirs(tagged_dir, exist_ok=True)
        os.makedirs(thumbnail_dir, exist_ok=True)
        
        # 6. Generate and save thumbnail
        if generate_thumbnail(untagged_path, thumbnail_path):
            image.tagged_thumb_path = thumbnail_path
            
        # 7. Move original image to tagged folder
        shutil.move(untagged_path, tagged_path)
        image.tagged_full_path = tagged_path
        
        # 8. Clear untagged paths
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