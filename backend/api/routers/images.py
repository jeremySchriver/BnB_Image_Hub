from fastapi import APIRouter, HTTPException, Depends, Query, File, UploadFile, status, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil

from backend.database.database import get_db
from backend.database.models.image import Image
from backend.database.schemas.image import ImageResponse, ImageUpdate, ImageCreate
from backend.database.schemas.tag import TagResponse
from backend.database.models.tag import Tag
from backend.database.models.author import Author
from backend.database.models.user import User
from backend.database.services.image_service import (
    get_image, get_all_untagged_images, get_next_untagged_image,
    update_image_tags, update_image_metadata, _generate_hash_filename,
    create_image, delete_image
)
from backend.config import TAG_PREVIEW_DIR, SEARCH_PREVIEW_DIR, UNTAGGED_DIR
from backend.processor.thumbnail_generator import generate_previews
from backend.api.routers.auth import get_current_user
from backend.utils.logging_config import setup_logging
from backend.utils.error_codes import ErrorCode
from backend.utils.error_handling import handle_error, AppError

# Initialize router
router = APIRouter(
    prefix="/images",
    tags=["images"]
)

# Set up logger for this module
logger = setup_logging("images")

# Create a limiter instance
limiter = Limiter(key_func=get_remote_address)

#############################################
# Image Content Endpoints
#############################################

'''Get image content from the database, including actual image file.'''
@router.get("/content/{image_id}")
async def get_image_content(
    image_id: int,
    db: Session = Depends(get_db)
):
    """
    Serve the actual image file content.
    
    Args:
        image_id (int): ID of the image to retrieve
        db (Session): Database session
        
    Returns:
        FileResponse: The image file
        
    Raises:
        HTTPException: 404 if image not found, 500 for server errors
    """
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

#############################################
# Image Tagging Endpoints
#############################################

'''Update tag method'''
@router.put("/tags/{image_id}")
def update_tags(
    image_id: int,
    update_data: ImageUpdate,
    db: Session = Depends(get_db)
):
    """
    Update image tags, generate thumbnail, and move to tagged storage.
    
    Args:
        image_id (int): ID of the image to update
        update_data (ImageUpdate): New tag and metadata information
        db (Session): Database session
        
    Returns:
        dict: Updated image information
    """
    try:
        updated_image = update_image_tags(
            db=db,
            image_id=image_id,
            tags=update_data.tags,
            author=update_data.author,
            filename=update_data.filename
        )
        
        if not updated_image:
            raise AppError(
                message="Image not found",
                error_code=ErrorCode.IMAGE_NOT_FOUND,
                status_code=status.HTTP_404_NOT_FOUND
            )
            
        return updated_image
        
    except Exception as e:
        print(f"Error in update_tags endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process image: {str(e)}"
        )
        
@router.put("/metadata/{image_id}")
def update_metadata(
    image_id: int,
    update_data: ImageUpdate,
    db: Session = Depends(get_db)
):
    """
    Update image metadata only (tags and author) without file operations.
    
    Args:
        image_id (int): ID of the image to update
        update_data (ImageUpdate): New metadata information
        db (Session): Database session
    """
    try:
        updated_image = update_image_metadata(
            db=db,
            image_id=image_id,
            tags=update_data.tags,
            author=update_data.author
        )
        
        if not updated_image:
            raise AppError(
                message="Image not found",
                error_code=ErrorCode.IMAGE_NOT_FOUND,
                status_code=status.HTTP_404_NOT_FOUND
            )
            
        return updated_image
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update image metadata: {str(e)}"
        )
        
#############################################
# Untagged Image Endpoints
#############################################

'''Untagged image page methods'''       
@router.get("/untagged/next")
def get_untagged_list(db: Session = Depends(get_db)):
    """Get the next untagged image from the database."""
    try:
        image = get_next_untagged_image(db)
        
        if not image:
            return []

        # Format response
        response = [{
            "id": str(image.id),
            "filename": image.filename,
            "tagged_full_path": image.tagged_full_path,
            "search_preview_path": image.search_preview_path,
            "tag_preview_path": image.tag_preview_path,
            "untagged_full_path": image.untagged_full_path,
            "tags": [tag.name for tag in image.tags],  # Convert tag objects to names
            "date_added": image.date_added.isoformat() if image.date_added else None,
            "author": image.author.name if image.author else None  # Get author name if exists
        }]
            
        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get untagged images list: {str(e)}"
        )
        
#############################################
# Search Endpoints
#############################################
        
'''Search for images by tags'''
@router.get("/search/tags/{tag_name}", response_model=List[ImageResponse])
def get_images_by_tag(
    tag_name: str,
    db: Session = Depends(get_db)
):
    """
    Get images by tag name from the database.
    
    Args:
        tag_name (str): Name of the tag to search for
        db (Session): Database session
        
    Returns:
        List[ImageResponse]: List of matching images
    """
    try:
        images = db.query(Image).join(Image.tags).filter(Tag.name == tag_name).all()
        
        if not images:
            raise AppError(
                message="No images found with this tag",
                error_code=ErrorCode.IMAGE_NOT_FOUND,
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # Format response
        response = []
        for image in images:
            image_data = {
                "id": str(image.id),
                "filename": image.filename,
                "tagged_full_path": image.tagged_full_path,
                "tagged_thumb_path": image.tagged_thumb_path,
                "untagged_full_path": image.untagged_full_path,
                "untagged_thumb_path": image.untagged_thumb_path,
                "tags": [tag.name for tag in image.tags],
                "date_added": image.date_added.isoformat() if image.date_added else None,
                "author": image.author.name if image.author else None
            }
            response.append(image_data)
            
        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get images by tag: {str(e)}"
        )

'''Search for images by id'''
@router.get("/search/{image_id}", response_model=ImageResponse)
def get_image_by_id(
    image_id: int,
    db: Session = Depends(get_db)
):
    """Get image by ID from the database."""
    try:
        image = get_image(db, image_id)
        if not image:
            raise AppError(
                message="Image not found",
                error_code=ErrorCode.IMAGE_NOT_FOUND,
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # Convert tags to TagResponse objects
        tag_responses = [
            TagResponse(
                id=tag.id,
                name=tag.name,
                date_added=tag.date_added
            ) for tag in image.tags
        ]
        
        # Format response
        response = ImageResponse(
            id=image.id,  # Note: Changed from str(image.id) to image.id as per model
            filename=image.filename,
            tagged_full_path=image.tagged_full_path,
            search_preview_path=image.search_preview_path,
            tag_preview_path=image.tag_preview_path,
            untagged_full_path=image.untagged_full_path,
            tags=tag_responses,
            date_added=image.date_added,
            author=image.author,
            file_size = image.file_size,
            file_type = image.file_type,
            width = image.width,
            height = image.height,
        )
        
        return response

    except Exception as e:
        logger.error(f"Error in get_image_by_id: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get image by ID: {str(e)}"
        )

'''Get all images from the database'''
@router.get("/search/all")
def get_all_images(db: Session = Depends(get_db)):
    """Get all images from the database."""
    try:
        images = db.query(Image).all()
        
        # Format response
        response = []
        for image in images:
            image_data = {
                "id": str(image.id),
                "filename": image.filename,
                "tagged_full_path": image.tagged_full_path,
                "tagged_thumb_path": image.tagged_thumb_path,
                "untagged_full_path": image.untagged_full_path,
                "untagged_thumb_path": image.untagged_thumb_path,
                "tags": [tag.name for tag in image.tags],
                "date_added": image.date_added.isoformat() if image.date_added else None,
                "author": image.author.name if image.author else None,
                "file_size": image.file_size,
                "file_type": image.file_type,
                "width": image.width,
                "height": image.height,
            }
            response.append(image_data)
            
        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get all images: {str(e)}"
        )
        
@router.get("/search")
def search_images(
    tags: Optional[str] = Query(None, description="Comma-separated list of tags"),
    author: Optional[str] = Query(None, description="Author name to filter by"),
    db: Session = Depends(get_db)
):
    """
    Search images with optional tag and author filters.
    
    Args:
        tags (str, optional): Comma-separated list of tags
        author (str, optional): Author name to filter by
        db (Session): Database session
        
    Returns:
        List[dict]: List of matching images
    """
    try:
        # Start with base query
        query = db.query(Image)

        # Apply filters if provided
        if tags:
            tag_list = [tag.strip().lower() for tag in tags.split(',') if tag.strip()]
            if tag_list:
                # Join with tags table and filter for images that have ALL specified tags
                for tag in tag_list:
                    query = query.join(Image.tags).filter(Tag.name == tag)

        if author:
            # Join with author table and filter by author name
            query = query.join(Image.author).filter(Author.name == author.strip())

        # Execute query and get results
        images = query.distinct().all()
        
        # Format response
        response = []
        for image in images:
            response.append({
                "id": str(image.id),
                "filename": image.filename,
                "tagged_full_path": image.tagged_full_path,
                "untagged_full_path": image.untagged_full_path,
                "tags": [tag.name for tag in image.tags],
                "date_added": image.date_added.isoformat() if image.date_added else None,
                "author": image.author.name if image.author else None,
                "file_size": image.file_size,
                "file_type": image.file_type,
                "width": image.width,
                "height": image.height,
            })
            
        return response

    except Exception as e:
        logger.error(f"Error in search_images: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search images: {str(e)}"
        )

#############################################
# Preview Image Endpoints
#############################################
        
@router.get("/preview/{size}/{image_id}")
async def get_preview(
    size: str,
    image_id: int, 
    db: Session = Depends(get_db)
):
    """
    Get pre-generated preview image.
    
    Args:
        size (str): Size of preview ('preview' or 'search')
        image_id (int): ID of the image
        db (Session): Database session
        
    Returns:
        FileResponse: Preview image file
    """
    try:
        if size not in ['preview', 'search']:
            raise AppError(
                message="Invalid preview size",
                error_code=ErrorCode.INVALID_IMAGE_FORMAT,
                status_code=status.HTTP_400_BAD_REQUEST
            )
            
        image = get_image(db, image_id)
        if not image:
            raise AppError(
                message="Image not found",
                error_code=ErrorCode.IMAGE_NOT_FOUND,
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # Use the stored preview path directly from the database
        preview_path = image.search_preview_path if size == 'search' else image.tag_preview_path
        
        if not preview_path or not os.path.exists(preview_path):
            raise AppError(
                message="Preview of image not found",
                error_code=ErrorCode.IMAGE_NOT_FOUND,
                status_code=status.HTTP_404_NOT_FOUND
            )
            
        return FileResponse(preview_path)
        
    except Exception as e:
        logger.error(f"Error retrieving preview: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving preview: {str(e)}"
        )
        
#############################################
# Upload and Delete Endpoints
#############################################
        
@router.post("/upload/batch")
async def upload_batch_images(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload multiple images at once.
    
    Args:
        files (List[UploadFile]): List of files to upload
        db (Session): Database session
        
    Returns:
        dict: Upload results including success/failure counts
    """
    try:
        results = {
            "success": True,
            "message": "",
            "failed": []
        }
        
        for file in files:
            try:
                # Generate unique filename (without extension)
                original_filename = os.path.splitext(file.filename)[0]
                hashed_filename = _generate_hash_filename(original_filename)
                
                # Get original extension
                file_extension = os.path.splitext(file.filename)[1].lower()
                
                # Set up paths
                untagged_path = os.path.join(UNTAGGED_DIR, f"{hashed_filename}{file_extension}")
                
                # Ensure directory exists
                os.makedirs(os.path.dirname(untagged_path), exist_ok=True)
                
                # Save file to untagged directory
                with open(untagged_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                
                # Create database record
                image_data = ImageCreate(
                    filename=hashed_filename,
                    untagged_full_path=untagged_path,
                    tag_preview_path=os.path.join(TAG_PREVIEW_DIR, f"{hashed_filename}.jpg"),
                    search_preview_path=os.path.join(SEARCH_PREVIEW_DIR, f"{hashed_filename}.jpg")
                )
                
                # Create image record first
                new_image = create_image(db, image_data)
                
                # Generate preview images after DB record exists
                if generate_previews(untagged_path, hashed_filename):
                    logger.info(f"Generated previews for {hashed_filename}")
                else:
                    logger.error(f"Failed to generate previews for {hashed_filename}")
                    results["failed"].append(file.filename)
                    
            except Exception as e:
                logger.error(f"Error processing file {file.filename}: {str(e)}")
                results["failed"].append(file.filename)
                
        # Set appropriate message
        if len(results["failed"]) > 0:
            results["message"] = f"Uploaded {len(files) - len(results['failed'])} files, {len(results['failed'])} failed"
        else:
            results["message"] = f"Successfully uploaded {len(files)} files"
            
        return results
        
    except Exception as e:
        logger.error(f"Upload batch error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )
        
@router.delete("/images/{image_id}")
@limiter.limit("20/minute")  # Limit to 20 requests per minute
async def delete_image_endpoint(
    request: Request,
    image_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Add this line
):
    """Delete an image and all its associated files."""
    # Check if user is admin
    if not (current_user.is_admin or current_user.is_superuser):
        raise AppError(
            message="Insufficient permissions to perform this action",
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
            status_code=status.HTTP_403_FORBIDDEN
        )
    image = get_image(db, image_id)
    if not image:
        raise AppError(
            message="Image not found",
            error_code=ErrorCode.IMAGE_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND
        )

    # List of paths to delete
    paths_to_delete = [
        image.untagged_full_path,
        image.tag_preview_path,
        image.search_preview_path
    ]

    # Delete all image files
    for path in paths_to_delete:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to delete file {path}: {str(e)}"
                )

    # Delete database record
    try:
        delete_image(db, image_id)
        return {"message": "Image deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException) and e.status_code == 429:
            # Rate limit exceeded
            retry_after = 60
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many login attempts. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete image record: {str(e)}"
            )