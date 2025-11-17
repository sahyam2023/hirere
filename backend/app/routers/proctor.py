import uuid
import cv2
import numpy as np
from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List
import time

# Internal application imports
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.proctor import UserFace, ProctorLog
from app.schemas.proctor import FramePayload
from app.core.proctoring_service import (
    check_face_presence_and_count,
    verify_identity,
    decode_image_from_base64,
)
from app.services.proctoring import generate_embedding
from app.core.proctoring_state import get_user_state

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent  # app/
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/register_face")
def register_face(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    image_base64_list: List[str] = Body(..., embed=True, description="A list of base64 encoded images.")
):
    if not image_base64_list or len(image_base64_list) < 3:
        raise HTTPException(status_code=400, detail="Please provide at least 3 images for robust registration.")

    embeddings = []
    reference_image_path = None

    for i, image_base64 in enumerate(image_base64_list):
        image_data = decode_image_from_base64(image_base64)
        if image_data is None:
            raise HTTPException(status_code=400, detail=f"Invalid image data received for image {i+1}.")

        embedding = generate_embedding(image_data)
        
        if embedding is None:
            raise HTTPException(
                status_code=400, 
                detail=f"Could not detect a single, clear face in image {i+1}. Please ensure your face is well-lit and not turned too far away from the camera."
            )

        embeddings.append(embedding)

        if i == 0:
            image_filename = f"{current_user.id}_{uuid.uuid4()}.jpg"
            reference_image_path = str(UPLOAD_DIR / image_filename)
            cv2.imwrite(reference_image_path, image_data)

    if not embeddings:
        raise HTTPException(status_code=400, detail="Face detection failed for all provided images.")

    average_embedding = np.mean(embeddings, axis=0)

    user_face = db.query(UserFace).filter(UserFace.user_id == current_user.id).first()
    if user_face:
        user_face.embedding_vector = average_embedding.tolist()
        user_face.image_path = reference_image_path
    else:
        user_face = UserFace(
            user_id=current_user.id,
            embedding_vector=average_embedding.tolist(),
            image_path=reference_image_path
        )
        db.add(user_face)
    
    db.commit()

    return {"message": "Face registered successfully using multiple angles."}


@router.post("/frame")
def frame(
    payload: FramePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = None
    event = "face_ok"
    image = decode_image_from_base64(payload.image_base64)
    state = get_user_state(current_user.id, payload.exam_id)

    print("\n" + "="*80)
    print(f"| PROCESSING FRAME at {time.strftime('%H:%M:%S')} for User: {current_user.id}, Exam: {payload.exam_id}")
    print("="*80)
    print(f"[STATE BEFORE]: face_missing: {state.face_missing_frames}, multi_face: {state.multi_face_frames}, mismatch: {state.identity_mismatch_frames}")

    face_check_event = check_face_presence_and_count(image)
    print(f"\n[STEP 1: DETECTION]: Face check result = '{face_check_event}'")

    if face_check_event == "no_face":
        event = "no_face"
        state.face_missing_frames += 1
        state.multi_face_frames = 0
        state.identity_mismatch_frames = 0
    elif face_check_event == "multi_face":
        state.multi_face_frames += 1
        state.face_missing_frames = 0
        state.identity_mismatch_frames = 0
    else:  # "face_ok"
        state.face_missing_frames = 0
        state.multi_face_frames = 0
        
        print("\n[STEP 2: VERIFICATION]: Face detected, verifying identity...")
        user_face = db.query(UserFace).filter(UserFace.user_id == current_user.id).first()
        if not user_face:
            raise HTTPException(status_code=400, detail="No baseline face registered for this user.")

        retrieved_embedding = user_face.embedding_vector
        
        # Ensure the embedding from the DB is a list of floats
        if not isinstance(retrieved_embedding, list):
             raise HTTPException(status_code=500, detail="Invalid embedding format in database.")

        match_score = verify_identity(image, retrieved_embedding)
        
        print(f"  - Match Score: {match_score:.4f} (Threshold: < {settings.face_match_threshold})")
        if match_score > settings.face_match_threshold:
            state.identity_mismatch_frames += 1
            print("  - Result: Identity MISMATCH.")
        else:
            state.identity_mismatch_frames = 0
            print("  - Result: Identity MATCHED.")

    print(f"\n[STATE AFTER UPDATE]: face_missing: {state.face_missing_frames}, multi_face: {state.multi_face_frames}, mismatch: {state.identity_mismatch_frames}")
    print("\n[STEP 3: ALERTING LOGIC]:")
    
    if state.face_missing_frames >= settings.proctoring_face_missing_threshold and state.can_trigger_alert("no_face"):
        alert = "Face not detected for an extended period."
        event = "no_face"
        state.record_alert("no_face")
        state.face_missing_frames = 0
    
    elif state.multi_face_frames >= settings.proctoring_multi_face_threshold and state.can_trigger_alert("multi_face"):
        alert = "Multiple faces detected."
        event = "multi_face"
        state.record_alert("multi_face")
        state.multi_face_frames = 0
        
    elif state.identity_mismatch_frames >= settings.proctoring_identity_mismatch_threshold and state.can_trigger_alert("identity_mismatch"):
        alert = "Face verification failed — identity mismatch."
        event = "identity_mismatch"
        state.record_alert("identity_mismatch")
        state.identity_mismatch_frames = 0
    else:
        print("- No alert conditions met.")

    if alert:
        proctor_log = ProctorLog(user_id=current_user.id, exam_id=payload.exam_id, session_id=payload.session_id, event_type=event, message=alert)
        db.add(proctor_log)
        db.commit()

    print(f"\n[RESPONSE]: event: '{event}', alert: '{alert}'")
    print("="*80 + "\n")

    return {"event": event, "alert": alert}
