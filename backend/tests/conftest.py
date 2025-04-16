import os
import sys
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from fastapi.security import OAuth2PasswordRequestForm

project_root = str(Path(__file__).parent.parent.parent)
sys.path.append(project_root)

from backend.database.models.base import Base
from backend.database.models.user import User
from backend.database.database import get_db
from backend.api.main import app
from backend.database.services.user_service import create_user
from backend.database.schemas.user import UserCreate

# Create in-memory test database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    
    # Create superuser immediately
    superuser_data = UserCreate(
        email="super@test.com",
        username="superuser",
        password="superPass!123",
        is_admin=True,
        is_superuser=True
    )
    create_user(db, superuser_data)
    db.commit()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

@pytest.fixture(scope="function")
def superuser_token(client):
    response = client.post(
        "/api/auth/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "username": "super@test.com",
            "password": "superPass!123",
            "grant_type": "password"
        }
    )
    
    if response.status_code != 200:
        print(f"Auth failed with status {response.status_code}: {response.text}")
        print(f"Response body: {response.text}")
    
    assert response.status_code == 200
    return response.json()["access_token"]