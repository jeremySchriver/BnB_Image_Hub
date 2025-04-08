from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
from backend.database.database import get_db
from backend.database.models.user import User
from backend.database.schemas.author import AuthorResponse, AuthorCreate, AuthorUpdate
from backend.database.services.author_service import search_authors as search_authors_service, get_author_list, get_author_by_id, get_author_by_email, create_author, delete_email_by_id
from backend.api.routers.auth import get_current_user
from backend.utils.logging_config import setup_logging
from backend.utils.error_codes import ErrorCode
from backend.utils.error_handling import handle_error, AppError

# Set up logger for this module
logger = setup_logging("authors")

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

@router.get("/", response_model=List[AuthorResponse])
def read_authors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    authors = get_author_list(db, skip=skip, limit=limit)
    return authors

@router.get("/{author_id}", response_model=AuthorResponse)
def read_author(author_id: int, db: Session = Depends(get_db)):
    author = get_author_by_id(db, author_id)
    if not author:
        raise AppError(
            message="Author not found",
            error_code=ErrorCode.AUTHOR_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND
        )
    return author

@router.post("/", response_model=AuthorResponse, status_code=status.HTTP_201_CREATED)
def create_new_author(author: AuthorCreate, db: Session = Depends(get_db)):
    db_author = get_author_by_email(db, author.email)
    if db_author:
        raise AppError(
            message="Author email already registered",
            error_code=ErrorCode.AUTHOR_EXISTS,
            status_code=status.HTTP_400_BAD_REQUEST
        )
    return create_author(db=db, author_data=author)

@router.put("/{author_id}", response_model=AuthorResponse)
def update_author(author_id: int, author_data: AuthorUpdate, db: Session = Depends(get_db)):
    db_author = get_author_by_id(db, author_id)
    if not db_author:
        raise AppError(
            message="Author not found",
            error_code=ErrorCode.AUTHOR_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    # Check if email is being changed and if it's already in use
    if author_data.email and author_data.email != db_author.email:
        existing_author = get_author_by_email(db, author_data.email)
        if existing_author:
            raise AppError(
                message="Author email already registered",
                error_code=ErrorCode.AUTHOR_EXISTS,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    for field, value in author_data.dict(exclude_unset=True).items():
        setattr(db_author, field, value)
    
    db.commit()
    db.refresh(db_author)
    return db_author

@router.delete("/{author_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_author(
    author_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user is admin
    if not (current_user.is_admin or current_user.is_superuser):
        raise AppError(
            message="Insufficient permissions to perform this action",
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    author = delete_email_by_id(db, author_id)
    if not author:
        raise AppError(
            message="Author not found",
            error_code=ErrorCode.AUTHOR_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND
        )
    return None