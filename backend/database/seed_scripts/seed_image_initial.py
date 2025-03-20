from sqlalchemy.orm import Session
import sys
import os
from pathlib import Path

# Get the project root directory (Image_Tagger)
project_root = Path(__file__).parent.parent.parent.parent
sys.path.append(str(project_root))

from backend.database.database import get_db
from backend.database.models.image import Image
from backend.database.schemas.image import ImageCreate
from backend.database.services.image_service import cast_constant_to_db, list_images

# Initial data using UserCreate instead of UserBase
image_data = [
    ImageCreate(filename="modern-anonymous-concept-with-flat-design_23-2147876483", untagged_full_path="E:\\Code_Projects\\Image_Tagger\\file_share\\un-tagged\\modern-anonymous-concept-with-flat-design_23-2147876483.jpg"),
    ImageCreate(filename="Smiley", untagged_full_path="E:\\Code_Projects\\Image_Tagger\\file_share\\un-tagged\\Smiley.png"),
    ImageCreate(filename="ve-fara-glass-lg", untagged_full_path="E:\\Code_Projects\\Image_Tagger\\file_share\\un-tagged\\ve-fara-glass-lg.webp")
]

def seed_image_constants(db: Session, image_data: list[ImageCreate]):
    for image in image_data:
        # Check if the image already exists by filename
        existing_images = db.query(Image).filter(Image.filename == image.filename).first()
        if not existing_images:
            # Create the image ref
            cast_constant_to_db(db, image)
        else:
            print(f"Image with filename {image.filename} already exists.")
            continue

if __name__ == "__main__":
    db = next(get_db()) 
    seed_image_constants(db, image_data)