from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database.database import get_db
from backend.database.schemas.tag import TagCreate, TagResponse
from backend.database.services.tag_service import (
    get_tag_by_partial_name,
    get_tag_list,
    create_tag,
    delete_tag_id,
    get_tag_id
)

router = APIRouter(
    prefix="/tags",
    tags=["tags"]
)

@router.get("", response_model=List[TagResponse])
async def get_all_tags(
    skip: int = 0,
    limit: int = 3000,
    db: Session = Depends(get_db)
):
    """Get all tags"""
    tags = get_tag_list(db, skip=skip, limit=limit)
    return [TagResponse.model_validate(tag) for tag in tags]

@router.get("/search", response_model=List[TagResponse])
async def search_tags(
    query: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Search tags by partial name match"""
    tags = get_tag_by_partial_name(db, query, limit)
    return [TagResponse.model_validate(tag) for tag in tags]

@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def add_tag(
    tag: TagCreate,
    db: Session = Depends(get_db)
):
    """Create a new tag"""
    try:
        db_tag = create_tag(db, tag)
        return TagResponse.model_validate(db_tag)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create tag: {str(e)}"
        )

@router.delete("/{tag_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_name: str,
    db: Session = Depends(get_db)
):
    """Delete a tag by name and remove it from all associated images"""
    # First get the tag by name to find its ID
    tag = get_tag_by_partial_name(db, tag_name, limit=1)
    if not tag or len(tag) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag '{tag_name}' not found"
        )
    
    tag_id = tag[0].id
    deleted_tag = delete_tag_id(db, tag_id)
    
    if not deleted_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag with ID {tag_id} not found"
        )
    
    return None