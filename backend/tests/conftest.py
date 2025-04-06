import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models.base import Base
from backend.database.database import get_db
from fastapi.testclient import TestClient
from backend.api.main import app
from backend.database.models.user import User
from backend.database.models.author import Author
from backend.database.models.image import Image
from backend.database.models.tag import Tag
from backend.database.models.relationships import image_tags
from backend.database.schemas.user import UserCreate
from backend.database.services.user_service import create_user, get_user_by_email
from datetime import datetime
import os

@pytest.fixture(scope="session")
def test_engine():
    # Use SQLite in-memory database for testing
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    
    # Import all models to ensure they're registered with Base.metadata
    from backend.database.models import base, user, author, image, tag
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    return engine

@pytest.fixture
def test_db(test_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture
def test_client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

@pytest.fixture
def authenticated_client(test_client):
    # Login with existing test admin account
    response = test_client.post(
        "/auth/login",
        data={
            "username": "unit_test_admin@bnb.com",
            "password": "1@unitTest"
        }
    )
    
    assert response.status_code == 200
    return test_client

@pytest.fixture(autouse=True)
def cleanup_database(test_db):
    yield
    # Clean up after each test
    test_db.query(Image).delete()
    test_db.query(Author).delete()
    test_db.query(Tag).delete()
    # Don't delete test user
    test_db.commit()

@pytest.fixture(autouse=True)
def setup_test_environment():
    os.environ["TESTING"] = "True"
    os.environ["SECRET_KEY"] = "test_secret_key"
    yield
    os.environ.pop("TESTING", None)
    os.environ.pop("SECRET_KEY", None)