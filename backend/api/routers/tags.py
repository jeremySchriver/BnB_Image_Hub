from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database.database import get_db
from backend.database.schemas.tag import TagResponse
from backend.database.services.tag_service import (
    get_tag_by_partial_name
)

router = APIRouter(
    prefix="/tags",
    tags=["tags"]
)

@router.get("/search")
def search_tags(
    query: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Search tags by partial name match"""
    tags = get_tag_by_partial_name(db, query, limit)
    return [TagResponse.model_validate(tag) for tag in tags]