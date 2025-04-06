import pytest
import io
from PIL import Image
from backend.database.schemas.author import AuthorCreate
from backend.database.services.author_service import create_author

def create_test_image():
    file = io.BytesIO()
    image = Image.new('RGB', size=(100, 100), color='red')
    image.save(file, 'png')
    file.name = 'test.png'
    file.seek(0)
    return file

def test_upload_image(authenticated_client, test_db):
    # Create test author first
    author = AuthorCreate(name="Image Test Author", email="image.test@example.com")
    db_author = create_author(test_db, author)
    
    # Create test image
    test_image = create_test_image()
    
    response = authenticated_client.post(
        "/images/upload/batch",
        files={"files": ("test.png", test_image, "image/png")},
        data={
            "author": db_author.name,
            "tags": "test,upload"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["uploaded_files"]) == 1

def test_search_images(authenticated_client, test_db):
    # First upload a test image
    test_image = create_test_image()
    author = AuthorCreate(name="Search Test Author", email="search.test@example.com")
    db_author = create_author(test_db, author)
    
    authenticated_client.post(
        "/images/upload/batch",
        files={"files": ("test.png", test_image, "image/png")},
        data={
            "author": db_author.name,
            "tags": "test,search"
        }
    )
    
    # Test search by tags
    response = authenticated_client.get("/images/search?tags=test,search")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "test" in data[0]["tags"]

def test_update_image_tags(authenticated_client, test_db):
    # First upload a test image
    test_image = create_test_image()
    author = AuthorCreate(name="Tag Test Author", email="tag.test@example.com")
    db_author = create_author(test_db, author)
    
    upload_response = authenticated_client.post(
        "/images/upload/batch",
        files={"files": ("test.png", test_image, "image/png")},
        data={
            "author": db_author.name,
            "tags": "initial"
        }
    )
    image_id = upload_response.json()["uploaded_files"][0]["id"]
    
    # Update tags
    response = authenticated_client.put(
        f"/images/{image_id}/tags",
        json={
            "tags": ["updated", "test"],
            "author": db_author.name
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "updated" in data["tags"]
    assert "test" in data["tags"]

def test_delete_image(authenticated_client, test_db):
    # First upload a test image
    test_image = create_test_image()
    author = AuthorCreate(name="Delete Test Author", email="delete.test@example.com")
    db_author = create_author(test_db, author)
    
    upload_response = authenticated_client.post(
        "/images/upload/batch",
        files={"files": ("test.png", test_image, "image/png")},
        data={
            "author": db_author.name,
            "tags": "delete-test"
        }
    )
    image_id = upload_response.json()["uploaded_files"][0]["id"]
    
    # Delete image
    response = authenticated_client.delete(f"/images/{image_id}")
    assert response.status_code == 204

    # Verify deletion
    response = authenticated_client.get(f"/images/{image_id}")
    assert response.status_code == 404

def test_unauthorized_image_operations(client):
    # Test without authentication
    endpoints = [
        ("POST", "/images/upload/batch"),
        ("PUT", "/images/1/tags"),
        ("DELETE", "/images/1")
    ]
    
    for method, endpoint in endpoints:
        response = client.request(method, endpoint)
        assert response.status_code == 403