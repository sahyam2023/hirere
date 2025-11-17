import cv2
import numpy as np
from app.core.face_analysis import get_face_analyzer
from app.core.config import settings
from typing import Union

def analyze_face(image: np.ndarray, baseline_embedding: list) -> str:
    """
    Analyzes a face from an image, compares it with a baseline embedding,
    and returns the event type.
    """
    try:
        face_analyzer = get_face_analyzer()
        faces = face_analyzer.get(image)

        if not faces:
            return "no_face"

        if len(faces) > 1:
            return "multi_face"

        # Generate embedding for the detected face
        current_embedding = faces[0].normed_embedding

        # Compare with the baseline embedding using cosine distance
        similarity = np.dot(current_embedding, np.array(baseline_embedding))
        distance = 1 - similarity

        if distance < settings.face_match_threshold:
            return "face_match"
        else:
            return "mismatch"

    except Exception as e:
        print(f"Error during face analysis: {e}")
        return "error"

def generate_embedding(image: np.ndarray) -> Union[list, None]:
    """
    Generates a face embedding from an image.
    """
    try:
        face_analyzer = get_face_analyzer()
        faces = face_analyzer.get(image)

        # Ensure exactly one face is detected for registration
        if len(faces) != 1:
            return None

        embedding = faces[0].normed_embedding
        return embedding.tolist()

    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None
