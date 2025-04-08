from enum import Enum

class ErrorCode(Enum):
    # Authentication Errors (400-499)
    INVALID_CREDENTIALS = "AUTH_001"
    TOKEN_EXPIRED = "AUTH_002"
    INSUFFICIENT_PERMISSIONS = "AUTH_003"
    INVALID_TOKEN = "AUTH_004"
    ACCOUNT_LOCKED = "AUTH_005"
    
    # User Management Errors
    USER_EXISTS = "USER_001"
    USER_NOT_FOUND = "USER_002"
    INVALID_USER_DATA = "USER_003"
    
    # Author Management Errors
    AUTHOR_EXISTS = "AUTHOR_001"
    AUTHOR_NOT_FOUND = "AUTHOR_002"
    INVALID_AUTHOR_DATA = "AUTHOR_003"
    
    # Image Processing Errors
    IMAGE_UPLOAD_FAILED = "IMG_001"
    INVALID_IMAGE_FORMAT = "IMG_002"
    IMAGE_NOT_FOUND = "IMG_003"
    
    # Database Errors
    DB_CONNECTION_ERROR = "DB_001"
    DB_QUERY_ERROR = "DB_002"
    DB_INTEGRITY_ERROR = "DB_003"
    
    # General Errors
    VALIDATION_ERROR = "GEN_001"
    RATE_LIMIT_EXCEEDED = "GEN_002"
    INTERNAL_ERROR = "GEN_003"