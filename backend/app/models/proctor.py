import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user_manually
from app.models.user import User
from app.models.proctor import UserFace, ProctorLog
from app.services.proctoring import generate_embedding, analyze_face
import shutil
from pathlib import Path
from typing import List

router = APIRouter()

UPLOAD_DIR = Path("/app/uploads")

@router.post("/register_face")
def register_face(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_manually),
    file: UploadFile = File(...)
):
    # Ensure the uploads directory exists
    UPLOAD_DIR.mkdir(exist_ok=True)

    # Save the uploaded file
    file_extension = Path(file.filename).suffix
    image_filename = f"{uuid.uuid4()}{file_extension}"
    image_path = UPLOAD_DIR / image_filename

    with image_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Generate face embedding
    embedding = generate_embedding(str(image_path))
    if not embedding:
        raise HTTPException(status_code=400, detail="Could not detect a face in the image.")

    # Save the embedding to the database
    user_face = UserFace(
        user_id=current_user.id,
        embedding_vector=embedding,
        image_path=str(image_path)
    )
    db.add(user_face)
    db.commit()

    return {"message": "Face registered successfully."}

@router.post("/frame")
def frame(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_manually),
    exam_id: int = Form(...),
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    # Ensure the uploads directory exists
    UPLOAD_DIR.mkdir(exist_ok=True)

    # Get the baseline embedding for the user
    user_face = db.query(UserFace).filter(UserFace.user_id == current_user.id).first()
    if not user_face:
        raise HTTPException(status_code=400, detail="No baseline face registered for this user.")

    baseline_embedding = user_face.embedding_vector

    # Save the uploaded file
    file_extension = Path(file.filename).suffix
    image_filename = f"{uuid.uuid4()}{file_extension}"
    image_path = UPLOAD_DIR / image_filename

    with image_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Analyze the face in the frame
    event_type = analyze_face(str(image_path), baseline_embedding)

    # Log the event
    proctor_log = ProctorLog(
        user_id=current_user.id,
        exam_id=exam_id,
        session_id=session_id,
        event_type=event_type,
        image_path=str(image_path)
    )
    db.add(proctor_log)
    db.commit()

    return {"event": event_type}

@router.get("/logs")
def get_proctor_logs(
    exam_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_manually)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    logs = db.query(ProctorLog).filter(ProctorLog.exam_id == exam_id).all()
    return logs

@router.get("/summary")
def get_proctor_summary(
    exam_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_manually)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    summary = db.query(
        ProctorLog.event_type,
        func.count(ProctorLog.event_type)
    ).filter(ProctorLog.exam_id == exam_id).group_by(ProctorLog.event_type).all()

    return {event: count for event, count in summary}
