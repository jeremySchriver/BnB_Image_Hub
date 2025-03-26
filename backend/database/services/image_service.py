from sqlalchemy.orm import Session
from fastapi import UploadFile, File
from ..models.image import Image
from ..schemas.image import ImageCreate
from ..models.tag import Tag
from ..schemas.tag import TagCreate
from ...processor.thumbnail_generator import generate_previews
from .tag_service import create_tag, get_tag_by_partial_name
from ..services.author_service import get_author_by_name, create_author
from ..schemas.author import AuthorCreate
from backend.config import TAGGED_DIR
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

        # 1. Process tags
        image.tags = []  # Clear existing tags
        for tag_name in tags:
            tag_name = tag_name.strip().lower()
            existing_tag = get_tag_by_partial_name(db, tag_name, limit=1)
            if existing_tag and existing_tag[0].name == tag_name:
                tag = existing_tag[0]
            else:
                tag = create_tag(db, TagCreate(name=tag_name))
            image.tags.append(tag)
        
        # 2. Update author if provided
        if author is not None:
            existing_author = get_author_by_name(db, author.strip())
            if existing_author:
                image.author_id = existing_author.id
            else:
                new_author = create_author(db, AuthorCreate(
                    name=author.strip(),
                    email=f"{author.strip().replace(' ', '_')}@placeholder.com"
                ))
                image.author_id = new_author.id

        # Early commit to save tag and author changes
        db.commit()

        # 3. Handle file operations only if untagged path exists
        if image.untagged_full_path and os.path.exists(image.untagged_full_path):
            try:
                # Generate new hashed filename
                original_filename = os.path.basename(image.untagged_full_path)
                hashed_filename = _generate_hash_filename(original_filename)
                image.filename = hashed_filename

                # Set up new file paths
                tagged_path = os.path.join(TAGGED_DIR, hashed_filename)

                # Generate preview images
                if generate_previews(image.untagged_full_path):
                    print(f"Generated previews for {hashed_filename}")
                else:
                    print(f"Failed to generate previews for {hashed_filename}")

                # Move original image to tagged folder
                shutil.move(image.untagged_full_path, tagged_path)
                image.tagged_full_path = tagged_path
                image.untagged_full_path = None

                # Commit file changes
                db.commit()
                db.refresh(image)

            except Exception as file_error:
                print(f"File operation error: {str(file_error)}")
                # Don't raise the error - we've already saved the tags and author

        return image

    except Exception as e:
        db.rollback()
        print(f"Database operation error: {str(e)}")
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

def get_next_untagged_image(db: Session):
    """Get the next untagged image that hasn't been processed yet."""
    return (
        db.query(Image)
        .filter(
            Image.untagged_full_path.isnot(None),  # Has an untagged path
            ~Image.tags.any()  # No tags assigned yet (using any() with ~ for "not any")
        )
        .first()
    )

def get_all_untagged_images(db: Session):
    """Get all images that haven't been tagged yet."""
    return (
        db.query(Image)
        .filter(
            Image.untagged_full_path.isnot(None),  # Has an untagged path
            ~Image.tags.any()  # No tags assigned yet (using any() with ~ for "not any")
        )
        .all()
    )

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
        search_preview_path=image_data.search_preview_path,
        tag_preview_path=image_data.tag_preview_path,
        untagged_full_path=image_data.untagged_full_path,
        author_id=image_data.author_id
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image