from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from backend.utils.error_codes import ErrorCode

class ErrorDetail(BaseModel):
    code: ErrorCode
    message: str
    timestamp: datetime = datetime.utcnow()
    path: str
    detail: Optional[Any] = None

class ErrorResponse(BaseModel):
    error: ErrorDetail