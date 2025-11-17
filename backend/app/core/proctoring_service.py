import cv2
import numpy as np
import base64
import threading
import binascii
from app.core.face_analysis import get_face_analyzer

# A global lock for InsightFace operations to ensure thread safety,
# especially with GPU resources.
ANALYZER_LOCK = threading.Lock()

# Define a constant for the number of faces that triggers a "multi_face" event.
MULTI_FACE_THRESHOLD = 1

def decode_image_from_base64(base64_string: str):
    """Decodes a base64 data URI to a CV2 image."""
    try:
        header, data = base64_string.split(',', 1)
        image_data = base64.b64decode(data)
        np_arr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if image is None:
            print("[ERROR] cv2.imdecode failed. The data is not a valid image format.")
            return None
            
        return image
    except (binascii.Error, ValueError) as e:
        print(f"[ERROR] Failed to decode base64 string. It may be malformed. Error: {e}")
        return None
    except Exception as e:
        print(f"[ERROR] An unexpected error occurred in decode_image_from_base64: {e}")
        return None

def check_face_presence_and_count(image):
    """
    Checks for the presence and number of faces in an image using InsightFace.
    This operation is thread-safe due to the global lock.
    """
    if image is None:
        return "no_face"

    try:
        with ANALYZER_LOCK:
            face_analyzer = get_face_analyzer()
            faces = face_analyzer.get(image)
        
        num_faces = len(faces)
        
        if num_faces == 0:
            return "no_face"
        elif num_faces > MULTI_FACE_THRESHOLD:
            return "multi_face"
        else:
            return "face_ok"
            
    except Exception as e:
        print(f"[ERROR] An unexpected error occurred in check_face_presence_and_count: {e}")
        return "no_face" # Default to no_face on error

def verify_identity(live_image, user_embedding):
    """
    Verifies the identity of a live image against a stored user embedding.
    This operation is thread-safe and uses cosine distance for comparison.
    """
    if live_image is None:
        return 1.0  # Return max distance for invalid images

    try:
        with ANALYZER_LOCK:
            face_analyzer = get_face_analyzer()
            live_faces = face_analyzer.get(live_image)
        
        # Expect exactly one face for verification
        if len(live_faces) != 1:
            print("[VERIFY INFO]: Expected 1 face, but found " + str(len(live_faces)))
            return 1.0

        live_embedding = live_faces[0].normed_embedding
        user_embedding_np = np.array(user_embedding)

        # Calculate cosine similarity and then distance
        similarity = np.dot(live_embedding, user_embedding_np)
        distance = 1 - similarity
        
        return distance

    except Exception as e:
        print(f"[VERIFY EXCEPTION]: An unexpected error occurred: {e}")
        return 1.0
