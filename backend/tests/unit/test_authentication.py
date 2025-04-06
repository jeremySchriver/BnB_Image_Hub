import pytest

def test_login_success(test_client):
    response = test_client.post(
        "/auth/login",
        data={
            "username": "unit_test_admin@bnb.com",
            "password": "1@unitTest" 
        }
    )
    assert response.status_code == 200
    assert "auth_token" in response.cookies

def test_login_invalid_credentials(test_client):
    response = test_client.post(
        "/auth/login",
        data={
            "username": "wrong@example.com", 
            "password": "WrongPass123!"
        }
    )
    assert response.status_code == 401

def test_logout(authenticated_client):
    response = authenticated_client.post("/auth/logout")
    assert response.status_code == 200
    assert "auth_token" not in response.cookies