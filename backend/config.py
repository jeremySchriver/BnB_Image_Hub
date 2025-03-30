import os
import secrets
from pydantic_settings import BaseSettings
from typing import Optional

# Base directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE_SHARE_DIR = os.path.join(BASE_DIR, "file_share")

# Specific directories
UNTAGGED_DIR = os.path.join(FILE_SHARE_DIR, "un-tagged")
TAGGED_DIR = os.path.join(FILE_SHARE_DIR, "tagged")
TAG_PREVIEW_DIR = os.path.join(FILE_SHARE_DIR, "tag_preview")
SEARCH_PREVIEW_DIR = os.path.join(FILE_SHARE_DIR, "search_preview")

class Settings(BaseSettings):
    # Security settings
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database settings
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/backend/database/tagger_db.db"
    
    # Directory settings
    BASE_DIR: str = BASE_DIR
    FILE_SHARE_DIR: str = FILE_SHARE_DIR
    UNTAGGED_DIR: str = UNTAGGED_DIR
    TAGGED_DIR: str = TAGGED_DIR
    TAG_PREVIEW_DIR: str = TAG_PREVIEW_DIR
    SEARCH_PREVIEW_DIR: str = SEARCH_PREVIEW_DIR

    # Additional settings that Uvicorn might pass
    pythonpath: Optional[str] = None
    debug: Optional[bool] = None
    reload: Optional[bool] = None
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # This will ignore any extra fields not defined in the model

# Create settings instance
settings = Settings()

# Ensure directories exist
for directory in [FILE_SHARE_DIR, UNTAGGED_DIR, TAGGED_DIR, TAG_PREVIEW_DIR, SEARCH_PREVIEW_DIR]:
    os.makedirs(directory, exist_ok=True)

# Export directory constants for backward compatibility
TAG_PREVIEW_DIR = settings.TAG_PREVIEW_DIR
SEARCH_PREVIEW_DIR = settings.SEARCH_PREVIEW_DIR