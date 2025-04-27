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
import io
from datetime import datetime
from pathlib import Path
import logging
from PIL import Image as PILImage
import mimetypes
from backend.utils.storage_interface import get_storage_provider
from backend.database.services import preview_service

logger = logging.getLogger(__name__)

storage = get_storage_provider()

def resize_image(img: PILImage.Image, max_size: int) -> PILImage.Image:
    """Resize image maintaining aspect ratio"""
    ratio = min(max_size/float(img.size[0]), max_size/float(img.size[1]))
    new_size = tuple(int(dim * ratio) for dim in img.size)
    return img.resize(new_size, PILImage.LANCZOS)

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
    
    # Combine timestamp and random chars without extension
    return f"{timestamp}-{random_chars}"

def update_image_metadata(
    db: Session, 
    image_id: int, 
    tags: List[str], 
    author: Optional[str] = None
) -> Optional[Image]:
    """Update image tags and author without file operations."""
    try:
        # Get image record
        image = get_image(db, image_id)
        if not image:
            return None

        # Process tags
        image.tags = []  # Clear existing tags
        for tag_name in tags:
            tag_name = tag_name.strip().lower()
            existing_tag = get_tag_by_partial_name(db, tag_name, limit=1)
            if existing_tag and existing_tag[0].name == tag_name:
                tag = existing_tag[0]
            else:
                tag = create_tag(db, TagCreate(name=tag_name))
            image.tags.append(tag)
        
        # Update author - now handles removal properly
        if author is None or author.strip() == '':
            # Remove author reference
            image.author_id = None
        else:
            # Add or update author
            existing_author = get_author_by_name(db, author.strip())
            if existing_author:
                image.author_id = existing_author.id
            else:
                new_author = create_author(db, AuthorCreate(
                    name=author.strip(),
                    email=f"{author.strip().replace(' ', '_')}@placeholder.com"
                ))
                image.author_id = new_author.id

        db.commit()
        db.refresh(image)
        return image

    except Exception as e:
        db.rollback()
        print(f"Database operation error: {str(e)}")
        raise e

    except Exception as e:
        db.rollback()
        print(f"Database operation error: {str(e)}")
        raise e

def update_image_tags(
    db: Session, 
    image_id: int, 
    tags: List[str], 
    author: Optional[str] = None,
    filename: Optional[str] = None
) -> Optional[Image]:
    """Update image tags and move the image to tagged storage."""
    try:
        image = get_image(db, image_id)
        if not image:
            return None

        # Process tags and author updates
        image.tags = []
        for tag_name in tags:
            tag_name = tag_name.strip().lower()
            existing_tag = get_tag_by_partial_name(db, tag_name, limit=1)
            if existing_tag and existing_tag[0].name == tag_name:
                tag = existing_tag[0]
            else:
                tag = create_tag(db, TagCreate(name=tag_name))
            image.tags.append(tag)
        
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

        # Move image to tagged folder if it's in untagged
        if image.untagged_full_path:
            try:
                # Download the original file
                file_data = storage.download_file(image.untagged_full_path)
                if file_data:
                    # Upload to tagged folder
                    tagged_path = f"tagged/{image.filename}"
                    tagged_url = storage.upload_file(
                        io.BytesIO(file_data),
                        tagged_path,
                        "image/jpeg"  # Adjust content type as needed
                    )
                    
                    # Update paths and delete old file
                    storage.delete_file(image.untagged_full_path)
                    image.tagged_full_path = tagged_url
                    image.untagged_full_path = None

            except Exception as e:
                logger.error(f"Error moving file to tagged storage: {str(e)}")

        db.commit()
        db.refresh(image)
        return image

    except Exception as e:
        db.rollback()
        logger.error(f"Error updating image tags: {str(e)}")
        raise e
    
async def save_image(db: Session, file: UploadFile, author: Optional[str] = None):
    """Save uploaded image and generate previews in B2 storage"""
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1].lower()
        hashed_filename = _generate_hash_filename(file.filename)
        full_filename = f"{hashed_filename}{file_extension}"
        base_filename = hashed_filename  # Store base filename without extension

        # Read file content
        file_content = await file.read()
        if not file_content:
            logger.error("Received empty file")
            raise ValueError("Empty file uploaded")

        # Create file objects for uploads
        original_file = io.BytesIO(file_content)
        preview_file = io.BytesIO(file_content)

        try:
            # Upload original file to untagged folder
            untagged_path = f"untagged/{full_filename}"
            original_file.seek(0)
            untagged_url = storage.upload_file(
                original_file,
                untagged_path,
                file.content_type or 'image/jpeg'
            )
            logger.info(f"Original file uploaded to: {untagged_url}")

            # Generate and upload previews
            img = PILImage.open(preview_file)

            # Convert RGBA/P images to RGB with white background
            if img.mode in ('RGBA', 'P'):
                background = PILImage.new('RGB', img.size, 'white')
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[3])
                else:
                    background.paste(img)
                img = background

            # Generate tag preview (800px)
            tag_preview = resize_image(img, max_size=800)
            tag_preview_buffer = io.BytesIO()
            tag_preview.save(tag_preview_buffer, format='JPEG', quality=85, optimize=True)
            tag_preview_buffer.seek(0)
            
            tag_preview_path = f"tag_preview/{base_filename}.jpg"
            tag_preview_url = storage.upload_file(
                tag_preview_buffer,
                tag_preview_path,
                "image/jpeg"
            )
            logger.info(f"Tag preview uploaded to: {tag_preview_url}")

            # Generate search preview (300px)
            search_preview = resize_image(img, max_size=300)
            search_preview_buffer = io.BytesIO()
            search_preview.save(search_preview_buffer, format='JPEG', quality=85, optimize=True)
            search_preview_buffer.seek(0)
            
            search_preview_path = f"search_preview/{base_filename}.jpg"
            search_preview_url = storage.upload_file(
                search_preview_buffer,
                search_preview_path,
                "image/jpeg"
            )
            logger.info(f"Search preview uploaded to: {search_preview_url}")

            # Create database record with all URLs
            image = Image(
                filename=full_filename,
                untagged_full_path=untagged_url,
                search_preview_path=search_preview_url,
                tag_preview_path=tag_preview_url,
                date_added=datetime.now()
            )

            if author:
                existing_author = get_author_by_name(db, author.strip())
                if existing_author:
                    image.author_id = existing_author.id
                else:
                    new_author = create_author(db, AuthorCreate(
                        name=author.strip(),
                        email=f"{author.strip().replace(' ', '_')}@placeholder.com"
                    ))
                    image.author_id = new_author.id

            db.add(image)
            db.commit()
            db.refresh(image)
            
            logger.info(f"Successfully saved image and generated previews for {full_filename}")
            return image

        except Exception as e:
            logger.error(f"Failed to upload files to B2: {str(e)}")
            raise

    except Exception as e:
        db.rollback()
        logger.error(f"Error saving image: {str(e)}")
        raise

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
    """Create a new image record in the database."""
    try:
        image = Image(
            filename=image_data.filename,
            tagged_full_path=image_data.tagged_full_path,
            search_preview_path=image_data.search_preview_path,
            tag_preview_path=image_data.tag_preview_path,
            untagged_full_path=image_data.untagged_full_path,
            file_size=None,
            file_type=None,
            width=None,
            height=None
        )
        
        file_details = get_image_details(image_data.untagged_full_path)
        if file_details:
            image.file_size = file_details.get("file_size")
            image.file_type = file_details.get("file_type")
            image.width = file_details.get("width")
            image.height = file_details.get("height")
        
        if image_data.author:
            # Handle author if provided
            existing_author = get_author_by_name(db, image_data.author.strip())
            if existing_author:
                image.author_id = existing_author.id
            else:
                new_author = create_author(db, AuthorCreate(
                    name=image_data.author.strip(),
                    email=f"{image_data.author.strip().replace(' ', '_')}@placeholder.com"
                ))
                image.author_id = new_author.id

        db.add(image)
        db.commit()
        db.refresh(image)
        return image
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating image record: {str(e)}")
        raise



'''Get image information from the database'''
def get_image(db: Session, image_id: int):
    return db.query(Image).filter(Image.id == image_id).first()

def list_images(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Image).offset(skip).limit(limit).all()

def get_image_details(file_path: str) -> dict:
    """Get detailed file information for an image."""
    try:
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Get file type
        file_type = mimetypes.guess_type(file_path)[0]
        
        # Get image dimensions
        with PILImage.open(file_path) as img:
            width, height = img.size
            
        return {
            "file_size": file_size,
            "file_type": file_type,
            "width": width,
            "height": height
        }
    except Exception as e:
        logger.error(f"Error getting image details: {str(e)}")
        return {}

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
'''def delete_image(db: Session, image_id: int):
    image = db.query(Image).filter(Image.id == image_id).first()
    if image:
        db.delete(image)
        db.commit()
    return image'''

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

def delete_image(db: Session, image_id: int) -> None:
    """Delete an image from the database."""
    image = get_image(db, image_id)
    if image:
        db.delete(image)
        db.commit()
        
def get_image_file(image_id: int, db: Session) -> Optional[bytes]:
    """Get image file content from storage"""
    image = get_image(db, image_id)
    if not image:
        return None
    return storage.download_file(image.untagged_full_path)

def get_image(db: Session, image_id: int) -> Optional[Image]:
    """Get image by ID from database"""
    return db.query(Image).filter(Image.id == image_id).first()