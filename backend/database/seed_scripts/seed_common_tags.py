from sqlalchemy.orm import Session
import sys
import os
from pathlib import Path

# Get the project root directory (Image_Tagger)
project_root = Path(__file__).parent.parent.parent.parent
sys.path.append(str(project_root))

from backend.database.database import get_db
from backend.database.models.tag import Tag
from backend.database.schemas.tag import TagCreate
from backend.database.services.tag_service import create_tag, get_tag_list, cast_constant_to_db

# Initial data using UserCreate instead of UserBase
tag_constants = [
    TagCreate(name="pokemon"),
    TagCreate(name="ninja turtles"),
    TagCreate(name="spirited away"),
    TagCreate(name="naruto"),
    TagCreate(name="one piece"),
    TagCreate(name="flowers"),
    TagCreate(name="seamless"),
    TagCreate(name="abstract"),
    TagCreate(name="landscape"),
]

def seed_tag_constants(db: Session, tag_constants: list[TagCreate]):  # Updated type hint
    for tag in tag_constants:
        # Check if the user already exists
        tagList = get_tag_list(db)
        if tag.name.lower() not in tagList:
            # Create the tag
            create_tag(db, tag)
            print(f"Tag {tag.name} created and added to the database.")
        else:
            print(f"Tag with name {tag.name} already exists.")
            continue
        
def purge_tag_table(db: Session):
    """Wipe the image table before seeding."""
    # Uncomment the following lines to wipe the table
    # This will delete all records in the Image table
    # WARNING: This operation is irreversible!
    db.query(Tag).delete()
    db.commit()
    print("Tag table wiped before seeding.")

def main():
    db = next(get_db()) 
    purge_tag_table(db)
    seed_tag_constants(db, tag_constants)

if __name__ == "__main__":
    main()