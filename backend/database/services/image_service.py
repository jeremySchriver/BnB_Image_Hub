from sqlalchemy.orm import Session
from fastapi import UploadFile, File
from ..models.image import Image
from ..schemas.image import ImageCreate
from typing import List, Optional

def create_image(db: Session, image_data: ImageCreate):
    image = Image(
        filename=image_data.filename,
        tagged_full_path=image_data.tagged_full_path,
        tagged_thumb_path=image_data.tagged_thumb_path,
        untagged_full_path=image_data.untagged_full_path,
        untagged_thumb_path=image_data.untagged_thumb_path,
        tags=image_data.tags,
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

def get_image(db: Session, image_id: int):
    return db.query(Image).filter(Image.id == image_id).first()

def list_images(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Image).offset(skip).limit(limit).all()

def delete_image(db: Session, image_id: int):
    image = db.query(Image).filter(Image.id == image_id).first()
    if image:
        db.delete(image)
        db.commit()
    return image

def update_image_tags(db: Session, image_id: int, tags: List[str]):
    image = get_image(db, image_id)
    if image:
        image.tags = tags
        db.commit()
        db.refresh(image)
    return image

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