from sqlalchemy.orm import Session
from fastapi import UploadFile, File
from .models.image import Image
from .database import get_db

def save_image(db: Session, file: UploadFile):
    image = Image(filename=file.filename, path=f"images/{file.filename}")
    db.add(image)
    db.commit()
    db.refresh(image)
    return image

def get_image(db: Session, image_id: int):
    return db.query(Image).filter(Image.id == image_id).first()

def list_images(db: Session):
    return db.query(Image).all()

def delete_image(db: Session, image_id: int):
    image = db.query(Image).filter(Image.id == image_id).first()
    if image:
        db.delete(image)
        db.commit()
    return image