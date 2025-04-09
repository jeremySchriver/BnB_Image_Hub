import logging
from fastapi import HTTPException, Request
from typing import Any, Optional
import traceback
import re
from datetime import datetime
from backend.utils.error_codes import ErrorCode
from backend.models.error_models import ErrorResponse, ErrorDetail

logger = logging.getLogger(__name__)

class AppError(Exception):
    """Base exception class for application errors"""
    def __init__(
        self, 
        message: str,
        error_code: ErrorCode,
        status_code: int = 500,
        detail: Optional[Any] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)

def sanitize_error_message(message: str) -> str:
    """Remove sensitive information from error messages"""
    # Add patterns for sensitive data you want to redact
    sensitive_patterns = [
        (r'password=\S+', 'password=*****'),
        (r'token=\S+', 'token=*****'),
        (r'email=\S+@\S+', 'email=*****'),
        (r'Bearer \S+', 'Bearer *****'),
        # Add more patterns as needed
    ]
    
    sanitized = message
    for pattern, replacement in sensitive_patterns:
        sanitized = re.sub(pattern, replacement, sanitized)
    return sanitized

def create_error_response(
    error_code: ErrorCode,
    message: str,
    request: Request,
    detail: Optional[Any] = None
) -> ErrorResponse:
    """Create a standardized error response"""
    return ErrorResponse(
        error=ErrorDetail(
            code=error_code,
            message=message,
            path=str(request.url.path),
            detail=detail
        )
    )

def handle_error(
    error: Exception,
    request: Request,
    log_message: str,
    error_code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    status_code: int = 500,
    public_message: Optional[str] = None,
    log_level: int = logging.ERROR,
) -> None:
    """Enhanced centralized error handling with logging"""
    
    # Sanitize the error message
    sanitized_error = sanitize_error_message(str(error))
    
    # Get the full stack trace
    stack_trace = traceback.format_exc()
    
    # Create request context for logging
    context = {
        "path": request.url.path,
        "method": request.method,
        "client_host": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }
    
    # Log the error with context
    logger.log(
        log_level,
        f"{log_message}: {sanitized_error}\n"
        f"Context: {context}\n"
        f"Stack trace:\n{stack_trace}"
    )
    
    # Create standardized error response
    error_response = create_error_response(
        error_code=error_code,
        message=public_message or "An unexpected error occurred",
        request=request,
        detail=None if status_code < 500 else {"id": str(datetime.utcnow())}
    )
    
    raise HTTPException(
        status_code=status_code,
        detail=error_response.dict()
    )