from sqlalchemy.orm import Session
import sys
import os
from pathlib import Path

# Get the project root directory (Image_Tagger)
project_root = Path(__file__).parent.parent.parent.parent
sys.path.append(str(project_root))

from backend.database.database import get_db
from backend.database.models.author import Author
from backend.database.schemas.author import AuthorCreate
from backend.database.services.author_service import create_author, get_author_list, cast_constant_to_db

# Initial data using UserCreate instead of UserBase
author_constants = [
    AuthorCreate(name="sasquatch designs", email="sassyDesigns@live.com"),
    AuthorCreate(name="zara rose", email="na@gmail.com")
]

def seed_author_constants(db: Session, author_constants: list[AuthorCreate]):  # Updated type hint
    for author in author_constants:
        # Check if the user already exists
        authorEmailList = []
        authorList = get_author_list(db)
        for db_author in authorList:
            authorEmailList.append(db_author.email.lower())
            
        if author.email.lower() not in authorList:
            # Create the author
            create_author(db, author)
            print(f"Author: {author.name} with email {author.email} created and added to the database.")
        else:
            print(f"Author with name: {author.name} already exists.")
            continue
        
def purge_tag_table(db: Session):
    """Wipe the image table before seeding."""
    # Uncomment the following lines to wipe the table
    # This will delete all records in the Image table
    # WARNING: This operation is irreversible!
    db.query(Author).delete()
    db.commit()
    print("Tag table wiped before seeding.")

def main():
    db = next(get_db()) 
    purge_tag_table(db)
    seed_author_constants(db, author_constants)

if __name__ == "__main__":
    main()