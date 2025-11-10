import uuid
import random
import cv2  # Add this import
from fastapi import APIRouter, Depends, Form, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.proctor import UserFace, ProctorLog
from app.core.proctoring_service import (
    check_face_presence_and_count,
    verify_identity,
    decode_image_from_base64,
    SIMILARITY_THRESHOLD
)
import shutil
from pathlib import Path
from typing import Optional

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


@router.post("/frame")
def frame(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    exam_id: int = Body(...),
    image_base64: str = Body(...)
):
    alert = None
    image = decode_image_from_base64(image_base64)
    
    face_detected, multiple_faces = check_face_presence_and_count(image)
    
    if not face_detected:
        alert = "Face not detected — please stay in frame."
        print(f"Proctoring violation for user {current_user.email}: Face not detected.")
    elif multiple_faces:
        alert = "Multiple people detected — please ensure you’re alone."
        print(f"Proctoring violation for user {current_user.email}: Multiple faces detected.")
    
    # Placeholder for half face or covered face detection
    # This would require a more sophisticated model, but we can simulate it.
    # For example, by checking if the face landmarks are symmetrical or complete.
    # if is_face_partially_covered(image):
    #     alert = "Face partially covered — please ensure your face is fully visible."
    #     print(f"Proctoring violation for user {current_user.email}: Face partially covered.")

    # Placeholder for camera covered/tampering
    # This could be detected by checking for frames that are too dark or uniform.
    # if is_camera_covered(image):
    #     alert = "Camera covered or tampered with — please ensure the camera is clear."
    #     print(f"Proctoring violation for user {current_user.email}: Camera covered.")

    match_score = None
    # Run identity check randomly (1 in 6 frames)
    if random.randint(0, 5) == 0:
        user_face = db.query(UserFace).filter(UserFace.user_id == current_user.id).first()
        if not user_face:
            raise HTTPException(status_code=400, detail="No baseline face registered for this user.")
        
        match_score = verify_identity(image, user_face.embedding_vector)
        
        if match_score > SIMILARITY_THRESHOLD: 
            alert = "Face verification failed — identity mismatch."

    if alert:
        proctor_log = ProctorLog(
            user_id=current_user.id,
            exam_id=exam_id,
            event_type=alert.split(" — ")[0].replace(" ", "_").lower(), 
            message=alert
        )
        db.add(proctor_log)
        db.commit()

    return {
        "face_detected": face_detected,
        "multiple_faces": multiple_faces,
        "match_score": match_score,
        "alert": alert
    }
