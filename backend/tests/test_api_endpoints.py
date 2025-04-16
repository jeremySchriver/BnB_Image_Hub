import pytest
from fastapi.testclient import TestClient
from .test_utils import get_auth_headers

def test_create_tag(client, superuser_token):
    headers = get_auth_headers(superuser_token)
    response = client.post(
        "/api/tags/",
        headers=headers,
        json={"name": "test_tag"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "test_tag"

def test_create_author(client, superuser_token):
    headers = get_auth_headers(superuser_token)
    response = client.post(
        "/api/authors/",
        headers=headers,
        json={
            "name": "Test Author",
            "email": "author@test.com"
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Test Author"

def test_unauthorized_access(client):
    # Try to access protected endpoint without token
    response = client.get("/api/users/")  # Update to match your actual users endpoint
    assert response.status_code == 401