import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.models.exam import Exam
from app.core.security import create_access_token
import base64
import os
from PIL import Image

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

def create_dummy_jpeg(path):
    """Creates a dummy 10x10 black JPEG image."""
    img = Image.new('RGB', (10, 10), color = 'black')
    img.save(path, 'jpeg')

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
    create_dummy_jpeg("test_image.jpg")
    with open("test_image.jpg", "rb") as f:
        image_bytes = f.read()
    os.remove("test_image.jpg")

    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    response = client.post(
        "/api/proctor/register_face",
        headers=get_auth_header(user),
        json={"image_base64_list": [f"data:image/jpeg;base64,{base64_image}"] * 3}
    )

    assert response.status_code == 400
    assert "Could not detect a single, clear face" in response.json()["detail"]

def test_frame(create_test_user):
    user = create_test_user
    create_dummy_jpeg("test_image.jpg")
    with open("test_image.jpg", "rb") as f:
        image_bytes = f.read()
    os.remove("test_image.jpg")

    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    response = client.post(
        "/api/proctor/frame",
        headers=get_auth_header(user),
        json={"exam_id": 1, "session_id": "test_session", "image_base64": f"data:image/jpeg;base64,{base64_image}"}
    )

    assert response.status_code == 200
    assert response.json() == {"event": "no_face", "alert": None}

# def test_get_proctor_logs_as_admin(create_test_admin):
#     admin = create_test_admin
#     response = client.get("/api/proctor/logs?exam_id=1", headers=get_auth_header(admin))
#     assert response.status_code == 200
#     assert response.json() == []

# def test_get_proctor_logs_as_user(create_test_user):
#     user = create_test_user
#     response = client.get("/api/proctor/logs?exam_id=1", headers=get_auth_header(user))
#     assert response.status_code == 403
#     assert response.json() == {"detail": "Not authorized"}
