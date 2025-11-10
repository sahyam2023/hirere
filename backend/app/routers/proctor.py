import uuid
import random
import cv2
from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.proctor import UserFace, ProctorLog
from app.core.proctoring_service import (
    check_face_presence_and_count,
    verify_identity,
    decode_image_from_base64,
)
from app.core.proctoring_state import get_user_state
from app.core.config import settings
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("/app/uploads")

@router.post("/register_face")
def register_face(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    image_base64: str = Body(..., embed=True)
):
    UPLOAD_DIR.mkdir(exist_ok=True)
    image_data = decode_image_from_base64(image_base64)
    if image_data is None:
        raise HTTPException(status_code=400, detail="Invalid image data")

    image_filename = f"{uuid.uuid4()}.jpg"
    image_path = UPLOAD_DIR / image_filename
    
    with image_path.open("wb") as buffer:
        buffer.write(cv2.imencode('.jpg', image_data)[1].tobytes())

    embedding_placeholder = [0.1] * 128

    user_face = UserFace(
        user_id=current_user.id,
        embedding_vector=embedding_placeholder,
        image_path=str(image_path)
    )
    db.add(user_face)
    db.commit()

    return {"message": "Face registered successfully."}


from app.schemas.proctor import FramePayload

@router.post("/frame")
def frame(
    payload: FramePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = None
    image = decode_image_from_base64(payload.image_base64)
    
    event = check_face_presence_and_count(image)
    state = get_user_state(current_user.id)

    if event == "no_face":
        state.face_missing_frames += 1
        state.multi_face_frames = 0
    elif event == "multi_face":
        state.multi_face_frames += 1
        state.face_missing_frames = 0
    else: # face_ok
        state.face_missing_frames = 0
        state.multi_face_frames = 0

    if state.face_missing_frames >= settings.proctoring_face_missing_threshold:
        alert = "Face not detected for an extended period."
        state.face_missing_frames = 0  # Reset after triggering
    
    if state.multi_face_frames >= settings.proctoring_multi_face_threshold:
        alert = "Multiple faces detected for an extended period."
        state.multi_face_frames = 0  # Reset after triggering

    # Run identity check randomly (1 in 6 frames)
    if random.randint(0, 5) == 0:
        user_face = db.query(UserFace).filter(UserFace.user_id == current_user.id).first()
        if not user_face:
            raise HTTPException(status_code=400, detail="No baseline face registered for this user.")
        
        match_score = verify_identity(image, user_face.embedding_vector)
        
        if match_score > settings.face_match_threshold: 
            alert = "Face verification failed — identity mismatch."

    if alert:
        proctor_log = ProctorLog(
            user_id=current_user.id,
            exam_id=payload.exam_id,
            session_id=payload.session_id,
            event_type=event,
            message=alert
        )
        db.add(proctor_log)
        db.commit()

    return {
        "event": event,
        "alert": alert
    }
