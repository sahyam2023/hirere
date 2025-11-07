from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.exam import Exam, Question, Submission
from app.schemas.exam_schema import ExamSchema, SubmissionSchema, ExamDetailSchema, ExamResponseSchema
from typing import List

router = APIRouter()

@router.post("/exams", response_model=ExamResponseSchema)
def create_exam(exam_data: ExamSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create exams")

    exam = Exam(
        title=exam_data.title,
        description=exam_data.description,
        duration_minutes=exam_data.duration_minutes,
        owner_id=current_user.id
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    for q in exam_data.questions:
        question = Question(
            exam_id=exam.id,
            text=q.text,
            options=q.options,
            correct_option=q.correct_option,
            marks=q.marks
        )
        db.add(question)
    db.commit()

    return exam

@router.get("/exams/{exam_id}", response_model=ExamDetailSchema)
def get_exam(exam_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.post("/exams/submit")
def submit_exam(submission_data: SubmissionSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exam = db.query(Exam).filter(Exam.id == submission_data.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    score = 0
    for question_id, answer in submission_data.answers.items():
        question = db.query(Question).filter(Question.id == question_id).first()
        if question and question.correct_option == answer:
            score += question.marks

    submission = Submission(
        user_id=current_user.id,
        exam_id=submission_data.exam_id,
        answers=submission_data.answers,
        score=score,
        duration_seconds=submission_data.duration_seconds
    )
    db.add(submission)
    db.commit()

    return {"msg": "submitted", "score": score}

@router.get("/my_submissions")
def get_my_submissions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    submissions = db.query(Submission).filter(Submission.user_id == current_user.id).all()
    return submissions

@router.get("/exams/{exam_id}/results")
def get_exam_results(exam_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the owner of this exam")

    submissions = db.query(Submission).filter(Submission.exam_id == exam_id).all()
    results = []
    for sub in submissions:
        candidate = db.query(User).filter(User.id == sub.user_id).first()
        results.append({
            "candidate_email": candidate.email,
            "score": sub.score,
            "submitted_at": sub.submitted_at
        })
    return results
