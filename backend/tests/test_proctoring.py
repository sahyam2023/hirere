import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.models.exam import Exam
from app.core.security import create_access_token
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

def test_register_face(create_test_user):
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

    # This test will fail because we are not mocking the face detection and embedding generation.
    # In a real application, you would mock these services to avoid actual ML model inference during testing.
    assert response.status_code == 400
    assert response.json() == {"detail": "Could not detect a face in the image."}

def test_frame(create_test_user):
    user = create_test_user
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

    assert response.status_code == 400
    assert response.json() == {"detail": "No baseline face registered for this user."}

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
