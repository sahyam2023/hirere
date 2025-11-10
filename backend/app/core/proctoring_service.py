import cv2
import numpy as np
from deepface import DeepFace
import base64

# Constants
FACE_ABSENCE_THRESHOLD_SEC = 5
SIMILARITY_THRESHOLD = 0.4
MULTI_FACE_THRESHOLD = 1

def decode_image_from_base64(base64_string: str):
    """Decodes a base64 string to a CV2 image."""
    try:
        if "," in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        np_arr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return image
    except Exception as e:
        # Handle potential decoding errors
        return None

def check_face_presence_and_count(image):
    """
    Checks for the presence and number of faces in an image using DeepFace.
    """
    if image is None:
        return "no_face"

    try:
        face_objs = DeepFace.extract_faces(
            img_path=image,
            enforce_detection=True,
            detector_backend="retinaface"  # <--- ADD THIS LINE FOR BETTER DETECTION
        )
        
        num_faces = len(face_objs)
        
        if num_faces == 0:
            return "no_face"
        elif num_faces > MULTI_FACE_THRESHOLD:
            return "multi_face"
        else:
            return "face_ok"
            
    except ValueError:
        return "no_face"

def verify_identity(live_image, user_embedding):
    """
    Verifies the identity of a live image against a stored user embedding.
    Returns: The cosine distance, where a lower value indicates a better match.
    """
    if live_image is None:
        return 1.0  # Return a high distance for invalid images

    try:
        # Verify the live image against the stored embedding
        result = DeepFace.verify(
            img1_path=live_image,
            img2_representation=user_embedding,
            model_name="ArcFace",
            distance_metric="cosine",
            enforce_detection=False  # We do detection separately
        )
        return result.get("distance", 1.0)
    except Exception:
        # If any error occurs (e.g., face not found in live_image),
        # return a high distance to signify a mismatch.
        return 1.0
