import cv2
import numpy as np
from deepface import DeepFace
from app.core.config import settings
from typing import Union

def analyze_face(image_path: str, baseline_embedding: list) -> str:
    """
    Analyzes a face from an image, compares it with a baseline embedding,
    and returns the event type.
    """
    try:
        # Face detection using Mediapipe
        face_objs = DeepFace.extract_faces(img_path=image_path, detector_backend='mediapipe', enforce_detection=False)

        if not face_objs:
            return "no_face"

        if len(face_objs) > 1:
            return "multi_face"

        # Generate embedding for the detected face
        current_embedding = DeepFace.represent(img_path=image_path, model_name='ArcFace', enforce_detection=False)[0]['embedding']

        # Compare with the baseline embedding
        distance = np.linalg.norm(np.array(current_embedding) - np.array(baseline_embedding))

        if distance < settings.face_match_threshold:
            return "face_match"
        else:
            return "mismatch"

    except Exception as e:
        print(f"Error during face analysis: {e}")
        return "error"

def generate_embedding(image_path: str) -> Union[list, None]:
    """
    Generates a face embedding from an image.
    """
    try:
        embedding = DeepFace.represent(img_path=image_path, model_name='ArcFace', enforce_detection=True)[0]['embedding']
        return embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None
