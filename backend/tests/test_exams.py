import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.models.user import User

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

@pytest.fixture(scope="module")
def client():
    db = TestingSessionLocal()

    # Create admin user
    admin_user = User(
        name="Admin User",
        email="admin@example.com",
        password_hash=hash_password("admin123"),
        role="admin"
    )
    db.add(admin_user)

    # Create regular user
    user = User(
        name="Test User",
        email="user@example.com",
        password_hash=hash_password("user123"),
        role="user"
    )
    db.add(user)
    db.commit()

    def override_get_db():
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def admin_token():
    return create_access_token(data={"sub": "admin@example.com"})

@pytest.fixture(scope="module")
def user_token():
    return create_access_token(data={"sub": "user@example.com"})

def test_create_exam_as_admin(client, admin_token):
    response = client.post(
        "/api/exams",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Test Exam",
            "description": "This is a test exam.",
            "duration_minutes": 60,
            "questions": [
                {
                    "text": "What is 2 + 2?",
                    "options": {"A": "3", "B": "4", "C": "5"},
                    "correct_option": "B",
                    "marks": 10
                }
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Exam"
    assert data["owner_id"] is not None

def test_create_exam_as_user(client, user_token):
    response = client.post(
        "/api/exams",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "title": "Test Exam",
            "description": "This is a test exam.",
            "duration_minutes": 60,
            "questions": []
        }
    )
    assert response.status_code == 403

def test_get_exam(client, admin_token):
    # First create an exam
    exam_response = client.post(
        "/api/exams",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Another Test Exam",
            "description": "Another test exam.",
            "duration_minutes": 30,
            "questions": []
        }
    )
    exam_id = exam_response.json()["id"]

    response = client.get(f"/api/exams/{exam_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Another Test Exam"

def test_submit_exam(client, user_token, admin_token):
    # Create an exam first
    exam_response = client.post(
        "/api/exams",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Submission Test Exam",
            "description": "A test exam for submission.",
            "duration_minutes": 15,
            "questions": [
                {
                    "text": "What is the capital of France?",
                    "options": {"A": "Berlin", "B": "Paris", "C": "London"},
                    "correct_option": "B",
                    "marks": 5
                }
            ]
        }
    )
    exam_id = exam_response.json()["id"]

    # Get the exam to find the question ID
    exam_detail_response = client.get(f"/api/exams/{exam_id}", headers={"Authorization": f"Bearer {admin_token}"})
    question_id = exam_detail_response.json()["questions"][0]["id"]

    response = client.post(
        "/api/exams/submit",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "exam_id": exam_id,
            "answers": {str(question_id): "B"},
            "duration_seconds": 120
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["msg"] == "submitted"
    assert data["score"] == 5
