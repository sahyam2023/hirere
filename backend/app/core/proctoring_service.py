import cv2
import numpy as np
import mediapipe as mp
from deepface import DeepFace
import base64

# Constants
FACE_ABSENCE_THRESHOLD_SEC = 5
SIMILARITY_THRESHOLD = 0.4
MULTI_FACE_THRESHOLD = 1

# Initialize Mediapipe Face Detection
mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.5)

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
    Checks for the presence and number of faces in an image using Mediapipe.
    Returns: A tuple (face_detected: bool, multiple_faces: bool)
    """
    if image is None:
        return False, False

    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_detection.process(rgb_image)

    if not results.detections:
        return False, False  # No faces detected
    
    num_faces = len(results.detections)
    multiple_faces = num_faces > MULTI_FACE_THRESHOLD
    
    return True, multiple_faces

def verify_identity(image, user_embedding):
    """
    Verifies the identity of the face in the image against a stored embedding.
    Returns: The cosine similarity score.
    """
    if image is None:
        return 0.0

    try:
        # DeepFace expects the image in BGR format
        result = DeepFace.verify(
            img1_path=image,
            img2_path=user_embedding,  # This should be the path to the user's registered face image or the embedding itself
            model_name="VGG-Face",
            distance_metric="cosine",
            enforce_detection=False
        )
        return result.get("distance", 1.0) # Return distance, default to 1.0 if not found
    except Exception as e:
        # Handle cases where DeepFace fails to find a face or other errors
        return 1.0 # Return a high distance value to indicate a mismatch
