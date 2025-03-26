from sqlalchemy.orm import Session
import os
import logging
from pathlib import Path
import sys
import shutil

# Get the project root directory (Image_Tagger)
project_root = Path(__file__).parent.parent.parent.parent
sys.path.append(str(project_root))

from backend.database.database import get_db
from backend.database.models.image import Image
from backend.processor.thumbnail_generator import generate_previews
from backend.database.services.image_service import _generate_hash_filename
from backend.config import UNTAGGED_DIR, TAG_PREVIEW_DIR, SEARCH_PREVIEW_DIR, TAGGED_DIR

logger = logging.getLogger(__name__)

def generate_previews_for_existing_images(db: Session):
    try:
        images = db.query(Image).all()
        for image in images:
            untagged_full_path = image.untagged_full_path
            if untagged_full_path:
                try:
                    # Get original extension
                    original_filename = os.path.basename(untagged_full_path)
                    file_extension = os.path.splitext(original_filename)[1]
                    
                    # Generate new hashed filename
                    hashed_filename = _generate_hash_filename(image.filename)
                    new_untagged_path = os.path.join(UNTAGGED_DIR, hashed_filename + file_extension)
                    
                    # Rename/move the original file
                    if untagged_full_path != new_untagged_path:
                        shutil.move(untagged_full_path, new_untagged_path)
                        logger.info(f"Renamed file from {original_filename} to {hashed_filename}")
                    
                    # Generate preview images
                    if generate_previews(new_untagged_path, hashed_filename):
                        print(f"Generated previews for {hashed_filename}")
                    else:
                        print(f"Failed to generate previews for {hashed_filename}")
                
                    # Update image properties before DB commit
                    image.filename = hashed_filename
                    image.untagged_full_path = new_untagged_path
                    image.tag_preview_path = os.path.join(TAG_PREVIEW_DIR,hashed_filename + ".jpg")
                    image.search_preview_path = os.path.join(SEARCH_PREVIEW_DIR, hashed_filename + ".jpg")
                    
                    # Commit file changes
                    db.commit()
                    db.refresh(image)
                    logger.info(f"Successfully processed image {image.id}: {hashed_filename}")
                    
                except Exception as e:
                    logger.error(f"Error processing image {image.id}: {str(e)}")
                    db.rollback()
            else:
                logger.warning(f"Image {image.id} has no valid untagged path or file missing: {untagged_full_path}")
    finally:
        db.close()

if __name__ == "__main__":
    db = next(get_db())
    generate_previews_for_existing_images(db)