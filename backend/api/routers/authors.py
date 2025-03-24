from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database.database import get_db
from backend.database.schemas.author import AuthorResponse
from backend.database.services.author_service import search_authors as search_authors_service

router = APIRouter(
    prefix="/authors",
    tags=["authors"]
)

@router.get("/search")
def search_authors(
    query: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Search authors by partial name match"""
    authors = search_authors_service(db, query, limit)
    return [AuthorResponse.model_validate(author) for author in authors]