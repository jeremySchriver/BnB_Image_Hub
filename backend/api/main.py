from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
import secrets
from typing import Optional
from backend.config import settings, get_csp_header
from backend.api.routers import images, users, tags, authors, preview_resize, auth
from backend.utils.logging_config import setup_logging
from backend.utils.error_handling import (
    handle_error, 
    create_error_response,
    AppError
)
from backend.utils.error_codes import ErrorCode

logger = setup_logging("main")

app = FastAPI(
    title="Image Tagger API",
    description="API for image tagging application",
    version="1.0.0"
)

# Add to your existing code
csrf_tokens = set()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security Headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = get_csp_header()
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response

async def csrf_middleware(request: Request, call_next):
    # Skip CSRF check for safe methods and auth endpoints
    if (request.method in ["GET", "HEAD", "OPTIONS"] or 
        request.url.path in [
            "/auth/login", 
            "/auth/refresh", 
            "/auth/csrf-token",
            "/auth/forgot-password",
            "/auth/reset-password"    
        ]):
        #request.url.path in ["/auth/login", "/auth/refresh", "/auth/csrf-token"]):
        response = await call_next(request)
        return response
        
    csrf_token = request.headers.get("X-CSRF-Token")
    if not csrf_token or csrf_token not in csrf_tokens:
        return Response(
            status_code=403,
            content="CSRF token missing or invalid"
        )
    
    response = await call_next(request)
    return response

# Add middleware
app.add_middleware(SecurityHeadersMiddleware)
app.middleware("http")(csrf_middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-CSRF-Token"],
    expose_headers=["content-type", "content-length", "set-cookie"]
)

# Include routers
app.include_router(images.router)
app.include_router(users.router)
app.include_router(tags.router)
app.include_router(authors.router)
app.include_router(preview_resize.router)
app.include_router(auth.router)

# CSRF token endpoint
@app.get("/auth/csrf-token")
async def get_csrf_token(response: Response):
    token = secrets.token_urlsafe(settings.CSRF_TOKEN_LENGTH)
    csrf_tokens.add(token)
    return {"csrf_token": token}

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    error_code = getattr(exc, "error_code", ErrorCode.INTERNAL_ERROR)
    error_response = create_error_response(
        error_code=error_code,
        message=str(exc.detail),
        request=request
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.dict()
    )

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    error_response = create_error_response(
        error_code=exc.error_code,
        message=exc.message,
        request=request,
        detail=exc.detail
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    handle_error(
        error=exc,
        request=request,
        log_message=f"Unhandled error on {request.method} {request.url.path}",
        error_code=ErrorCode.INTERNAL_ERROR,
        public_message="An unexpected error occurred"
    )