from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.exam import Submission
from typing import List

router = APIRouter(tags=["submissions"])

@router.get("/submissions/admin/all")
def get_all_submissions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    submissions = db.query(Submission).all()
    return submissions
