import pytest
from backend.database.services.user_service import (
    create_user,
    get_user_by_email,
    authenticate_user,
    add_admin_flag
)
from backend.database.schemas.user import UserCreate

def test_create_user(test_db):
    user_data = UserCreate(
        email="test@example.com",
        username="testuser",
        password="testpass123",
        is_active=True
    )
    
    user = create_user(test_db, user_data)
    assert user.email == "test@example.com"
    assert user.username == "testuser"
    assert user.is_active == True
    assert user.is_admin == False
    assert user.is_superuser == False

def test_authenticate_user(test_db):
    # Create test user
    user_data = UserCreate(
        email="auth@example.com",
        username="authuser",
        password="authpass123",
        is_active=True
    )
    create_user(test_db, user_data)
    
    # Test successful authentication
    authenticated_user = authenticate_user(test_db, "auth@example.com", "authpass123")
    assert authenticated_user is not None
    assert authenticated_user.email == "auth@example.com"
    
    # Test failed authentication
    failed_auth = authenticate_user(test_db, "auth@example.com", "wrongpass")
    assert failed_auth is None