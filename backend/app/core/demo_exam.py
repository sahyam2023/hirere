from sqlalchemy.orm import Session
from app.models.exam import Exam, Question
from app.models.user import User
from app.core.security import hash_password

def get_or_create_demo_exam(db: Session) -> Exam:
    """
    Retrieves the demo exam from the database or creates it if it does not exist.
    """
    demo_exam = db.query(Exam).filter(Exam.title == "Test Exam").first()
    if demo_exam:
        return demo_exam

    # If demo exam doesn't exist, create it
    # First, find or create an admin user to own the exam
    admin_user = db.query(User).filter(User.role == "admin").first()
    if not admin_user:
        admin_user = User(
            name="Admin",
            email="admin@example.com",
            password_hash=hash_password("admin"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    demo_exam = Exam(
        title="Test Exam",
        description="This is a demo exam to test the proctoring functionality.",
        owner_id=admin_user.id,
        duration_minutes=10,
        is_active=True
    )
    db.add(demo_exam)
    db.commit()
    db.refresh(demo_exam)

    # Add 5 dummy questions to the exam
    for i in range(1, 6):
        question = Question(
            exam_id=demo_exam.id,
            text=f"This is dummy question {i}",
            options=[
                {"option_id": "A", "text": "Option A"},
                {"option_id": "B", "text": "Option B"},
                {"option_id": "C", "text": "Option C"},
            ],
            correct_option="A",
            marks=10
        )
        db.add(question)

    db.commit()
    return demo_exam
