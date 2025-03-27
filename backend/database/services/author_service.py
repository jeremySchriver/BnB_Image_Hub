from sqlalchemy.orm import Session
from ..models.author import Author
from ..schemas.author import AuthorCreate

'''Create new author in the database'''
def create_author(db: Session, author_data: AuthorCreate) -> Author:
    author = Author(
        name=author_data.name.strip().lower(),
        email=author_data.email
    )
    db.add(author)
    db.commit()
    db.refresh(author)
    return author

'''Get tag information from the database'''
def get_author_by_id(db: Session, author_id: int):
    return db.query(Author).filter(Author.id == author_id).first()

def get_author_by_email(db: Session, email: str):
    return db.query(Author).filter(Author.email == email).first()

def get_author_by_name(db: Session, name: str):
    return db.query(Author).filter(Author.name == name).first()

def get_author_list(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(Author).offset(skip).limit(limit).all()

'''Deletion methods'''
def delete_email_by_id(db: Session, author_id: int):
    author = db.query(Author).filter(Author.id == author_id).first()
    if author:
        db.delete(author)
        db.commit()
    return author

'''Seed constant data into the database'''    
def cast_constant_to_db(db: Session, author_data: AuthorCreate) -> Author:
    db_author = Author(
        name=author_data.name,
        email=author_data.email
    )
    db.add(db_author)
    db.commit()
    db.refresh(db_author)
    return db_author

'''Type ahead text methods'''
def search_authors(db: Session, query: str, limit: int = 10):
    """Search authors by partial name match"""
    return db.query(Author)\
        .filter(Author.name.ilike(f"%{query}%"))\
        .limit(limit)\
        .all()