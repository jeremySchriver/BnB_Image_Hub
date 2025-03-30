from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database.database import get_db
from backend.database.schemas.author import AuthorResponse, AuthorCreate, AuthorUpdate
from backend.database.services.author_service import search_authors as search_authors_service, get_author_list, get_author_by_id, get_author_by_email, create_author, delete_email_by_id

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
        raise HTTPException(status_code=404, detail="Author not found")
    return author

@router.post("/", response_model=AuthorResponse, status_code=status.HTTP_201_CREATED)
def create_new_author(author: AuthorCreate, db: Session = Depends(get_db)):
    db_author = get_author_by_email(db, author.email)
    if db_author:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    return create_author(db=db, author_data=author)

@router.put("/{author_id}", response_model=AuthorResponse)
def update_author(author_id: int, author_data: AuthorUpdate, db: Session = Depends(get_db)):
    db_author = get_author_by_id(db, author_id)
    if not db_author:
        raise HTTPException(status_code=404, detail="Author not found")
    
    # Check if email is being changed and if it's already in use
    if author_data.email and author_data.email != db_author.email:
        existing_author = get_author_by_email(db, author_data.email)
        if existing_author:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
    
    for field, value in author_data.dict(exclude_unset=True).items():
        setattr(db_author, field, value)
    
    db.commit()
    db.refresh(db_author)
    return db_author

@router.delete("/{author_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_author(author_id: int, db: Session = Depends(get_db)):
    author = delete_email_by_id(db, author_id)
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return None