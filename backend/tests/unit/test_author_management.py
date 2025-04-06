import pytest
from backend.database.schemas.author import AuthorCreate
from backend.database.services.author_service import create_author

def test_create_author(authenticated_client, test_db):
    response = authenticated_client.post(
        "/authors/",
        json={
            "name": "Test Author",
            "email": "author@example.com"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Author"
    assert data["email"] == "author@example.com"
    assert "id" in data

def test_create_duplicate_author(authenticated_client, test_db):
    # Create first author
    author_data = {
        "name": "Test Author",
        "email": "duplicate@example.com"
    }
    authenticated_client.post("/authors/", json=author_data)
    
    # Try to create duplicate
    response = authenticated_client.post("/authors/", json=author_data)
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

def test_get_authors(authenticated_client, test_db):
    # Create some test authors first
    author1 = AuthorCreate(name="Author 1", email="author1@example.com")
    author2 = AuthorCreate(name="Author 2", email="author2@example.com")
    create_author(test_db, author1)
    create_author(test_db, author2)
    
    response = authenticated_client.get("/authors/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    assert any(author["name"] == "Author 1" for author in data)

def test_get_single_author(authenticated_client, test_db):
    # Create test author
    author = AuthorCreate(name="Single Author", email="single@example.com")
    db_author = create_author(test_db, author)
    
    response = authenticated_client.get(f"/authors/{db_author.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Single Author"
    assert data["email"] == "single@example.com"

def test_update_author(authenticated_client, test_db):
    # Create test author
    author = AuthorCreate(name="Update Test", email="update@example.com")
    db_author = create_author(test_db, author)
    
    response = authenticated_client.put(
        f"/authors/{db_author.id}",
        json={
            "name": "Updated Author",
            "email": "updated@example.com"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Author"
    assert data["email"] == "updated@example.com"

def test_delete_author(authenticated_client, test_db):
    # Create test author
    author = AuthorCreate(name="Delete Test", email="delete@example.com")
    db_author = create_author(test_db, author)
    
    response = authenticated_client.delete(f"/authors/{db_author.id}")
    assert response.status_code == 204

    # Verify deletion
    response = authenticated_client.get(f"/authors/{db_author.id}")
    assert response.status_code == 404

def test_unauthorized_access(client):
    # Test without authentication
    endpoints = [
        ("POST", "/authors/"),
        ("PUT", "/authors/1"),
        ("DELETE", "/authors/1")
    ]
    
    for method, endpoint in endpoints:
        response = client.request(
            method, 
            endpoint,
            json={"name": "Test", "email": "test@example.com"}
        )
        assert response.status_code == 403

def test_search_authors(authenticated_client, test_db):
    # Create test authors
    authors = [
        AuthorCreate(name="John Doe", email="john@example.com"),
        AuthorCreate(name="Jane Doe", email="jane@example.com"),
        AuthorCreate(name="Alice Smith", email="alice@example.com")
    ]
    for author in authors:
        create_author(test_db, author)
    
    # Test search
    response = authenticated_client.get("/authors/search?query=doe")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all("Doe" in author["name"] for author in data)