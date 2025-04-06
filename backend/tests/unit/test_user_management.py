import pytest
from backend.database.schemas.user import UserCreate, UserUpdate
from backend.database.services.user_service import create_user

def test_create_user(authenticated_client):
    response = authenticated_client.post(
        "/users/",
        json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "NewUser123!",
            "is_active": True
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data

def test_get_current_user(authenticated_client, test_db):
    response = authenticated_client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"

def test_update_user(authenticated_client):
    response = authenticated_client.put(
        "/users/me",
        json={
            "username": "updateduser",
            "email": "updated@example.com"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "updateduser"