from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()

@router.post("/users")
def create_user(name: str, email: str, password: str, db: Session = Depends(get_db)):
    user = User(name=name, email=email, password_hash=password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "email": user.email}

@router.get("/users")
def get_users(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    # now this endpoint requires a valid Bearer token
    users = db.query(User).all()
    return users
