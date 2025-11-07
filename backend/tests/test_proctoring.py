import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User, Base
from app.models.proctor import UserFace
from app.core.security import create_access_token
from unittest.mock import patch
import os

# Create a test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency to use the test database
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="function")
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def create_test_user(setup_database):
    user = User(name="Test User", email="test@example.com", password_hash="hashedpassword", role="user")
    db = next(override_get_db())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def create_test_admin(setup_database):
    admin = User(name="Admin User", email="admin@example.com", password_hash="hashedpassword", role="admin")
    db = next(override_get_db())
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

def get_auth_header(user):
    token = create_access_token(data={"sub": user.email})
    return {"Authorization": f"Bearer {token}"}

@patch("app.routers.proctor.generate_embedding")
def test_register_face_success(mock_generate_embedding, create_test_user):
    mock_generate_embedding.return_value = [0.1] * 128
    user = create_test_user
    with open("test_image.jpg", "wb") as f:
        f.write(os.urandom(1024))

    with open("test_image.jpg", "rb") as f:
        response = client.post(
            "/api/proctor/register_face",
            headers=get_auth_header(user),
            files={"file": ("test_image.jpg", f, "image/jpeg")}
        )

    os.remove("test_image.jpg")

    assert response.status_code == 200
    assert response.json() == {"message": "Face registered successfully."}

@patch("app.routers.proctor.generate_embedding")
def test_register_face_no_face(mock_generate_embedding, create_test_user):
    mock_generate_embedding.return_value = None
    user = create_test_user
    with open("test_image.jpg", "wb") as f:
        f.write(os.urandom(1024))

    with open("test_image.jpg", "rb") as f:
        response = client.post(
            "/api/proctor/register_face",
            headers=get_auth_header(user),
            files={"file": ("test_image.jpg", f, "image/jpeg")}
        )

    os.remove("test_image.jpg")

    assert response.status_code == 400
    assert response.json() == {"detail": "Could not detect a face in the image."}

@patch("app.routers.proctor.analyze_face")
def test_frame_success(mock_analyze_face, create_test_user):
    mock_analyze_face.return_value = "face_match"
    user = create_test_user

    # First, register a face for the user
    db = next(override_get_db())
    user_face = UserFace(user_id=user.id, embedding_vector=[0.1] * 128, image_path="test.jpg")
    db.add(user_face)
    db.commit()

    with open("test_image.jpg", "wb") as f:
        f.write(os.urandom(1024))

    with open("test_image.jpg", "rb") as f:
        response = client.post(
            "/api/proctor/frame",
            headers=get_auth_header(user),
            data={"exam_id": 1, "session_id": "test_session"},
            files={"file": ("test_image.jpg", f, "image/jpeg")}
        )

    os.remove("test_image.jpg")

    assert response.status_code == 200
    assert response.json() == {"event": "face_match"}

def test_get_proctor_logs_as_admin(create_test_admin):
    admin = create_test_admin
    response = client.get("/api/proctor/logs?exam_id=1", headers=get_auth_header(admin))
    assert response.status_code == 200
    assert response.json() == []

def test_get_proctor_logs_as_user(create_test_user):
    user = create_test_user
    response = client.get("/api/proctor/logs?exam_id=1", headers=get_auth_header(user))
    assert response.status_code == 403
    assert response.json() == {"detail": "Not authorized"}
