from fastapi import APIRouter, Depends, HTTPException, status
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
    get_current_user,
    verify_password
)
from backend.api.auth import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    return create_user(db=db, user_data=user)

@router.get("/by_id/{user_id}", response_model=UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/by_username/{username}", response_model=UserResponse)
def read_user_by_username(username: str, db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, username=username)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/by_id/{user_id}", response_model=UserResponse)
def update_user_info(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db)
):
    return update_user(db=db, user_id=user_id, user_data=user_data)

@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure we have fresh user data from the database
    db_user = get_user_by_id(db, user_id=current_user.id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

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
                raise HTTPException(
                    status_code=400,
                    detail="Current password is required to change password"
                )
            if not verify_password(update_data['currentPassword'], current_user.hashed_password):
                raise HTTPException(
                    status_code=400,
                    detail="Current password is incorrect"
                )
            
        # Handle username update
        if update_data.get('username') and update_data['username'] != current_user.username:
            existing_user = get_user_by_username(db, update_data['username'])
            if existing_user and existing_user.id != current_user.id:
                raise HTTPException(
                    status_code=400,
                    detail="Username already taken"
                )
                
        # Handle email update
        if update_data.get('email') and update_data['email'] != current_user.email:
            existing_user = get_user_by_email(db, update_data['email'])
            if existing_user and existing_user.id != current_user.id:
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
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