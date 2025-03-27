from sqlalchemy.orm import Session
import sys
import os
from pathlib import Path

# Get the project root directory (Image_Tagger)
project_root = Path(__file__).parent.parent.parent.parent
sys.path.append(str(project_root))

from backend.database.models.image import Image
from backend.database.services.image_service import get_image_details
from backend.database.database import get_db

def populate_image_details(db: Session):
    try:
        images = db.query(Image).all()
        for image in images:
            path = image.tagged_full_path or image.untagged_full_path
            if path and os.path.exists(path):
                details = get_image_details(path)
                for key, value in details.items():
                    setattr(image, key, value)
        db.commit()
    except Exception as e:
        print(f"Error populating image details: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    db = next(get_db())
    populate_image_details(db)