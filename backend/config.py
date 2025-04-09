import os
import secrets
from pydantic_settings import BaseSettings
from typing import Optional, List

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
    
    #Token settings
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_HOURS: int = 7
    TOKEN_ALGORITHM: str = "HS256"
    CSRF_TOKEN_LENGTH: int = 32
    
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
    
    # Security settings
    PRODUCTION: bool = False
    COOKIE_SAMESITE: str = "lax"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:8080"]
    CSP_DIRECTIVES: dict = {
        "default-src": ["'self'"],
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "script-src": ["'self'"],  # Stricter for production
        "connect-src": ["'self'"],
        "font-src": ["'self'", "data:"],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "referrer": ["strict-origin-when-cross-origin"]
    }
    
    # URL settings
    if PRODUCTION:
        BASE_URL: str = "https://your-production-url.com"
        FRONTEND_URL: str = "https://your-production-frontend-url.com"
        COOKIE_SECURE: bool = True
    else:
        BASE_URL: str = "http://localhost:8000"
        FRONTEND_URL: str = "http://localhost:8080"
        COOKIE_SECURE: bool = False
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # This will ignore any extra fields not defined in the model

# Create settings instance
settings = Settings()

def get_csp_header() -> str:
    """Generate CSP header based on environment"""
    if settings.PRODUCTION:
        return "; ".join(
            f"{key} {' '.join(values)}" 
            for key, values in settings.CSP_DIRECTIVES.items()
        )
    else:
        # Development CSP with looser restrictions
        return (
            "default-src 'self'; "
            "img-src 'self' data: blob: http://localhost:8000; "
            "style-src 'self' 'unsafe-inline'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "connect-src 'self' http://localhost:8000; "
            "font-src 'self' data:; "
            "frame-ancestors 'none'; "
            "object-src 'none'; "
            "base-uri 'self';"
        )

# Ensure directories exist
for directory in [FILE_SHARE_DIR, UNTAGGED_DIR, TAGGED_DIR, TAG_PREVIEW_DIR, SEARCH_PREVIEW_DIR]:
    os.makedirs(directory, exist_ok=True)

# Export directory constants for backward compatibility
TAG_PREVIEW_DIR = settings.TAG_PREVIEW_DIR
SEARCH_PREVIEW_DIR = settings.SEARCH_PREVIEW_DIR