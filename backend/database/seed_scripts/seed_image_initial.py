from sqlalchemy.orm import Session
import sys
import os
import shutil
from pathlib import Path

# Get the project root directory (Image_Tagger)
project_root = Path(__file__).parent.parent.parent.parent
sys.path.append(str(project_root))

from backend.database.database import get_db
from backend.database.models import Image, Author, Tag
from backend.database.schemas.image import ImageCreate
from backend.database.services.image_service import cast_constant_to_db, list_images

# Initial data using UserCreate instead of UserBase
image_data = [
    ImageCreate(
        filename="modern-anonymous-concept-with-flat-design_23-2147876483", untagged_full_path="E:\\Code_Projects\\Image_Tagger\\file_share\\un-tagged\\modern-anonymous-concept-with-flat-design_23-2147876483.jpg",
        tag_ids=[],
        author_id=None 
        ),
    ImageCreate(
        filename="Smiley", untagged_full_path="E:\\Code_Projects\\Image_Tagger\\file_share\\un-tagged\\Smiley.png",
        tag_ids=[],
        author_id=None 
        ),
    ImageCreate(
        filename="ve-fara-glass-lg", untagged_full_path="E:\\Code_Projects\\Image_Tagger\\file_share\\un-tagged\\ve-fara-glass-lg.webp",
        tag_ids=[],
        author_id=None 
        ),
    ImageCreate(
        filename="IMG_1851", untagged_full_path="E:\\Code_Projects\\Image_Tagger\\file_share\\un-tagged\\IMG_1851.png",
        tag_ids=[],
        author_id=None 
        ),
    ImageCreate(
        filename="IMG_2389", untagged_full_path="E:\\Code_Projects\\Image_Tagger\\file_share\\un-tagged\\IMG_2389.png",
        tag_ids=[],
        author_id=None 
        ),
    ImageCreate(
        filename="IMG_8576 (1)", untagged_full_path="E:\\Code_Projects\\Image_Tagger\\file_share\\un-tagged\\IMG_8576 (1).jpg",
        tag_ids=[],
        author_id=None 
        ),
    ImageCreate(
        filename="Rainbow on rainbow Pokémon patches", untagged_full_path="E:\\Code_Projects\\Image_Tagger\\file_share\\un-tagged\\Rainbow on rainbow Pokémon patches.png",
        tag_ids=[],
        author_id=None 
        ),
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
        
def purge_image_table(db: Session):
    """Wipe the image table before seeding."""
    # Uncomment the following lines to wipe the table
    # This will delete all records in the Image table
    # WARNING: This operation is irreversible!
    db.query(Image).delete()
    db.commit()
    print("Image table wiped before seeding.")

# Move files from seed_images to un-tagged folder
def move_files_to_untagged_folder():
    seed_folder_path = "E:\\Code_Projects\\Image_Tagger\\file_share\\seed_images"

    for filename in os.listdir(seed_folder_path):
        source_path = os.path.join(seed_folder_path, filename)
        print(source_path)
        
        target_path = source_path.replace('seed_images', 'un-tagged')
        print(target_path)
        
        if os.path.isfile(source_path):
            shutil.copy(source_path, target_path)
            print(f'Moved: {source_path} -> {target_path}')
            
def main():
    db = next(get_db()) 
    purge_image_table(db)
    move_files_to_untagged_folder()
    seed_image_constants(db, image_data)

if __name__ == "__main__":
    main()