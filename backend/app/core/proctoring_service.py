import cv2
import numpy as np
from deepface import DeepFace
import base64
import threading
import binascii

# Import the correct distance function from the modern deepface module path.
from deepface.modules.verification import find_cosine_distance

# --- Create a global lock for all DeepFace operations ---
# This is the most critical fix for stability. It ensures that only one 
# thread can access the underlying C++ libraries (TensorFlow, OpenCV) at a time,
# preventing memory corruption errors like "double free" or "malloc".
DEEPFACE_LOCK = threading.Lock()

# Define a constant for the number of faces that triggers a "multi_face" event.
MULTI_FACE_THRESHOLD = 1

def decode_image_from_base64(base64_string: str):
    """Decodes a base64 data URI to a CV2 image."""
    
    # --- DEBUGGING: Print the start of the received string ---
    print(f"[DEBUG] Received image string (first 60 chars): {base64_string[:60]}")

    try:
        # Find the comma that separates the metadata from the data
        # This is more robust than just splitting.
        header, data = base64_string.split(',', 1)
        
        # The data is now the pure base64 string
        image_data = base64.b64decode(data)
        
        np_arr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        # Check if decoding to an image was successful
        if image is None:
            print("[ERROR] cv2.imdecode failed. The data is not a valid image format.")
            return None
            
        return image

    except (binascii.Error, ValueError) as e:
        # This will catch errors from b64decode (like incorrect padding)
        # or from the string split if the comma isn't found.
        print(f"[ERROR] Failed to decode base64 string. It may be malformed. Error: {e}")
        return None
    except Exception as e:
        # Catch any other unexpected errors
        print(f"[ERROR] An unexpected error occurred in decode_image_from_base64: {e}")
        return None

def check_face_presence_and_count(image):
    """
    Checks for the presence and number of faces in an image using a robust detector.
    This operation is thread-safe due to the global lock.
    """
    if image is None:
        return "no_face"

    try:
        # Acquire the lock to ensure this is the only thread running a DeepFace function.
        with DEEPFACE_LOCK:
            # Pass a copy of the image to DeepFace to prevent any potential
            # memory conflicts where the original object is modified.
            face_objs = DeepFace.extract_faces(
                img_path=image.copy(),
                enforce_detection=True,
                detector_backend="retinaface"
            )
        # The lock is automatically released after the 'with' block.
        
        num_faces = len(face_objs)
        
        if num_faces == 0:
            return "no_face"
        elif num_faces > MULTI_FACE_THRESHOLD:
            return "multi_face"
        else:
            return "face_ok"
            
    except ValueError:
        # DeepFace throws ValueError if enforce_detection is True and no face is found.
        return "no_face"

def verify_identity(live_image, user_embedding):
    """
    Verifies the identity of a live image against a stored user embedding.
    This operation is thread-safe and uses the correct low-level comparison logic.
    """
    if live_image is None:
        return 1.0  # Return max distance for invalid images

    try:
        # Acquire the lock to ensure this is the only thread running a DeepFace function.
        with DEEPFACE_LOCK:
            # 1. Generate the embedding for the live camera image.
            # Pass a copy to prevent memory corruption.
            live_embedding_obj = DeepFace.represent(
                img_path=live_image.copy(),
                model_name="ArcFace",
                enforce_detection=True,
                detector_backend="retinaface"
            )
        # The lock is automatically released here.
        
        live_embedding = live_embedding_obj[0]["embedding"]

        # 2. Compare the live embedding with the stored embedding using the correct function.
        distance = find_cosine_distance(live_embedding, user_embedding)
        
        return distance

    except (ValueError, IndexError):
        # This occurs if DeepFace.represent fails to find a face in the live image.
        # This is considered a failed verification.
        print("[VERIFY INFO]: No face detected in the live frame during verification step.")
        return 1.0
    except Exception as e:
        # Catch any other unexpected errors during verification.
        print(f"[VERIFY EXCEPTION]: An unexpected error occurred: {e}")
        return 1.0