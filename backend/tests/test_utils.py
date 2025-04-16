from backend.database.schemas.user import UserCreate
from backend.database.services.user_service import create_user

def create_test_user(db, email="test@example.com", username="testuser", 
                    password="testpass123", is_admin=False, is_superuser=False):
    user_data = UserCreate(
        email=email,
        username=username,
        password=password,
        is_active=True,
        is_admin=is_admin,
        is_superuser=is_superuser
    )
    return create_user(db, user_data)

def create_test_tag(db, client, token, name="test_tag"):
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/api/tags/",
        headers=headers,
        json={"name": name}
    )
    return response.json()

def get_auth_headers(token: str) -> dict:
    """Helper function to create authorization headers"""
    return {"Authorization": f"Bearer {token}"}

def authenticate_user_for_testing(client, email: str, password: str) -> str:
    """Helper function to get authentication token"""
    response = client.post(
        "/api/auth/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "username": email,
            "password": password,
            "grant_type": "password"
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]