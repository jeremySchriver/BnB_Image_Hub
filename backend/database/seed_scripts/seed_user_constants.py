from sqlalchemy.orm import Session
import sys
import os
from pathlib import Path

# Get the project root directory (Image_Tagger)
project_root = Path(__file__).parent.parent.parent.parent
sys.path.append(str(project_root))

from backend.database.database import get_db
from backend.database.models.user import User
from backend.database.schemas.user import UserCreate  # Changed from UserBase
from backend.database.services.user_service import get_user_by_email, create_user

# Initial data using UserCreate instead of UserBase
user_constants = [
    UserCreate(email="jer@bnb.com", username="jer", password="test123",is_admin=True, is_superuser=True),
    UserCreate(email="alice@bnb.com", username="alice", password="test234",is_admin=True),
    UserCreate(email="usertester@bnb.com", username="stock_user", password="stockPersona",is_admin=True)
]

def seed_user_constants(db: Session, user_constants: list[UserCreate]):  # Updated type hint
    for user in user_constants:
        # Check if the user already exists
        existing_user = get_user_by_email(db, email=user.email)
        if not existing_user:
            # Create the user
            create_user(db, user)
        else:
            print(f"User with email {user.email} already exists.")
            continue
        
def purge_user_table(db: Session):
    """Wipe the image table before seeding."""
    # Uncomment the following lines to wipe the table
    # This will delete all records in the Users table
    # WARNING: This operation is irreversible!
    db.query(User).delete()
    db.commit()
    print("User table wiped before seeding.")

if __name__ == "__main__":
    db = next(get_db()) 
    purge_user_table(db)
    seed_user_constants(db, user_constants)