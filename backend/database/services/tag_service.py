from sqlalchemy.orm import Session
from ..models.tag import Tag
from ..schemas.tag import TagCreate

'''Create new tag in the database'''
def create_tag(db: Session, tag_data: TagCreate) -> Tag:
    tag = Tag(name=tag_data.name.strip().lower())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag

'''Get tag information from the database'''
def get_tag_id(db: Session, tag_id: int):
    return db.query(Tag).filter(Tag.id == tag_id).first()

def get_tag_name(db: Session, tag_id: int):
    return db.query(Tag).filter(Tag.id == tag_id).first()

def get_tag_list(db: Session, skip: int = 0, limit: int = 3000):
    return db.query(Tag).offset(skip).limit(limit).all()

def get_tag_by_partial_name(db: Session, query: str, limit: int = 10):
    """Search tags by partial name match"""
    return db.query(Tag)\
        .filter(Tag.name.ilike(f"%{query}%"))\
        .limit(limit)\
        .all()

'''Deletion methods'''
def delete_tag_id(db: Session, tag_id: int):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if tag:
        db.delete(tag)
        db.commit()
    return tag

'''Seed constant data into the database'''    
def cast_constant_to_db(db: Session, tag_data: TagCreate) -> Tag:
    db_tag = Tag(
        name=tag_data.name
    )
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag