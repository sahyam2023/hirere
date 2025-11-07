from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.core.security import verify_password, hash_password, create_access_token
from app.schemas.user_schema import RegisterSchema

router = APIRouter()

@router.post("/register")
def register(payload: RegisterSchema, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(payload.password[:72])
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hashed_pw
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"msg": "registered"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = form_data.username   # Swagger sends "username", not "email"
    password = form_data.password

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}
