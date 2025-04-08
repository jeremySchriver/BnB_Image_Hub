from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from typing import List
from backend.database.database import get_db
from backend.database.models.user import User
from backend.database.schemas.user import UserCreate, UserResponse, UserUpdate
from backend.database.services.user_service import (
    create_user,
    get_user_by_id,
    get_user_by_username,
    get_user_by_email,
    update_user,
    verify_password,
    add_admin_flag,
    remove_admim_flag
)
from backend.api.routers.auth import get_current_user
from backend.utils.logging_config import setup_logging
from backend.utils.error_codes import ErrorCode
from backend.utils.error_handling import handle_error, AppError

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

# Set up logger for this module
logger = setup_logging("users")

# Create a limiter instance
limiter = Limiter(key_func=get_remote_address)

# Endpoint to add admin status for a user
@router.post("/{user_email}/admin", response_model=UserResponse)
@limiter.limit("10/hour") 
async def set_admin_status(
    request: Request,
    user_email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_superuser:
        raise AppError(
            message="Insufficient permissions to perform this action",
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    try:
        updated_user = add_admin_flag(db, user_email)
        return updated_user
    except Exception as e:
        handle_error(
            error=e,
            request=request,
            log_message="Failed to set admin status",
            error_code=ErrorCode.USER_EXISTS,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            public_message="Unable to set admin status for user"
        )

# Endpoint to remove admin status from a user
@router.delete("/{user_email}/admin", response_model=UserResponse)
@limiter.limit("10/hour") 
async def remove_admin_status(
    request: Request,
    user_email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_superuser:
        raise AppError(
            message="Insufficient permissions to perform this action",
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    try:
        updated_user = remove_admim_flag(db, user_email)
        return updated_user
    except Exception as e:
        handle_error(
            error=e,
            request=request,
            log_message="Failed to remove admin status",
            error_code=ErrorCode.USER_EXISTS,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            public_message="Unable to remove admin status for user"
        )

# Create a new user
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/day") 
def create_new_user(
    user: UserCreate, 
    request: Request, 
    db: Session = Depends(get_db)
):
    try:
        db_user = get_user_by_email(db, email=user.email)
        if db_user:
            raise AppError(
                message="Email already registered",
                error_code=ErrorCode.USER_EXISTS,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        db_user = get_user_by_username(db, username=user.username)
        if db_user:
            raise AppError(
                message="Username already registered",
                error_code=ErrorCode.USER_EXISTS,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        return create_user(db=db, user_data=user)
    except AppError as ae:
        raise ae
    except Exception as e:
        handle_error(
            error=e,
            request=request,
            log_message="Failed to create user",
            error_code=ErrorCode.INTERNAL_ERROR,
            status_code=status.HTTP_400_BAD_REQUEST,
            public_message="Unable to create user"
        )

# Endpoint to delete a user
@router.delete("/{user_email}", response_model=None)
@limiter.limit("30/hour") 
async def delete_user(
    request: Request,
    user_email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a user. Only accessible by superusers."""
    if not current_user.is_superuser:
        raise AppError(
            message="Insufficient permissions to perform this action",
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    if user_email == current_user.email:
        raise AppError(
            message="Cannot delete your own account",
            error_code=ErrorCode.VALIDATION_ERROR,
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user_to_delete = get_user_by_email(db, user_email)
        if not user_to_delete:
            raise AppError(
                message="User not found",
                error_code=ErrorCode.USER_NOT_FOUND,
                status_code=status.HTTP_404_NOT_FOUND
            )
            
        if user_to_delete.is_superuser:
            raise AppError(
                message="Insufficient permissions to perform this action",
                error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
                status_code=status.HTTP_403_FORBIDDEN
            )
            
        db.delete(user_to_delete)
        db.commit()
        return JSONResponse(content={"message": "User deleted successfully"})
        
    except HTTPException as he:
        raise he
    except Exception as e:
        handle_error(
            error=e,
            request=request,
            log_message="Failed to delete user",
            error_code=ErrorCode.INTERNAL_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            public_message="Unable to delete user"
        )

# Read user by ID
@router.get("/by_id/{user_id}", response_model=UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise AppError(
            message="User not found",
            error_code=ErrorCode.USER_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND
        )
    return db_user

# Update user information by ID
@router.put("/by_id/{user_id}", response_model=UserResponse)
def update_user_info(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db)
):
    return update_user(db=db, user_id=user_id, user_data=user_data)

# Read all users. Only accessible by superusers.
@router.get("/all", response_model=List[UserResponse])
async def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users. Only accessible by superusers."""
    if not current_user.is_superuser:
        raise AppError(
            message="Insufficient permissions to perform this action",
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    users = db.query(User).all()
    return users

# Endpoint to get the current authenticated user's information
@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure we have fresh user data from the database
    db_user = get_user_by_id(db, user_id=current_user.id)
    if db_user is None:
        raise AppError(
            message="User not found",
            error_code=ErrorCode.USER_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND
        )
    return db_user

# Endpoint to update the current authenticated user's information
@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        update_data = user_data.dict(exclude_unset=True)
        
        # Handle password update
        if update_data.get('password'):
            if not update_data.get('currentPassword'):
                raise AppError(
                    message="Current password is required to change password",
                    error_code=ErrorCode.INVALID_CREDENTIALS,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            if not verify_password(update_data['currentPassword'], current_user.hashed_password):
                raise AppError(
                    message="Incorrect information provided",
                    error_code=ErrorCode.INVALID_CREDENTIALS,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
        # Handle username update
        if update_data.get('username') and update_data['username'] != current_user.username:
            existing_user = get_user_by_username(db, update_data['username'])
            if existing_user and existing_user.id != current_user.id:
                raise AppError(
                    message="Username already taken",
                    error_code=ErrorCode.USER_EXISTS,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
                
        # Handle email update
        if update_data.get('email') and update_data['email'] != current_user.email:
            existing_user = get_user_by_email(db, update_data['email'])
            if existing_user and existing_user.id != current_user.id:
                raise AppError(
                    message="Email already registered",
                    error_code=ErrorCode.USER_EXISTS,
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        # Remove currentPassword before updating
        if 'currentPassword' in update_data:
            del update_data['currentPassword']

        # Update user
        updated_user = update_user(db=db, user_id=current_user.id, update_data=update_data)
        return updated_user

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Update error: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )