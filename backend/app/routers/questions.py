from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.exam import Question
from app.schemas.exam_schema import QuestionSchema
from typing import List

router = APIRouter(tags=["questions"])

@router.get("/questions", response_model=List[QuestionSchema])
def get_questions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    questions = db.query(Question).all()
    return questions

@router.post("/questions", response_model=QuestionSchema)
def create_question(question_data: QuestionSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create questions")

    question = Question(**question_data.dict())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question

@router.put("/questions/{question_id}", response_model=QuestionSchema)
def update_question(question_id: int, question_data: QuestionSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update questions")

    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    for key, value in question_data.dict().items():
        setattr(question, key, value)

    db.commit()
    db.refresh(question)
    return question

@router.delete("/questions/{question_id}", status_code=204)
def delete_question(question_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete questions")

    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(question)
    db.commit()
    return {"ok": True}
