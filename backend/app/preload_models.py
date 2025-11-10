import logging
from deepface import DeepFace
import numpy as np
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def preload_models():
    """
    Downloads and caches the machine learning models required by the application.
    This ensures that the models are ready before the web server starts,
    preventing timeouts and crashes during the first request.
    """
    logger.info("Starting model pre-loading...")

    try:
        # Define a dummy image for pre-loading the detector
        dummy_image = np.zeros((100, 100, 3), dtype=np.uint8)

        # Pre-load the "ArcFace" model for face recognition
        logger.info("Pre-loading 'ArcFace' model...")
        DeepFace.build_model("ArcFace")
        logger.info("'ArcFace' model pre-loaded successfully.")

        # Pre-load the "RetinaFace" model for face detection
        logger.info("Pre-loading 'RetinaFace' detector...")
        DeepFace.extract_faces(
            img_path=dummy_image,
            detector_backend="retinaface",
            enforce_detection=False
        )
        logger.info("'RetinaFace' detector pre-loaded successfully.")

        logger.info("All models have been pre-loaded.")

    except Exception as e:
        logger.error(f"An error occurred during model pre-loading: {e}", exc_info=True)
        # Exit with a non-zero status code to indicate failure
        exit(1)

if __name__ == "__main__":
    # Ensure the user's home directory for DeepFace cache exists
    home = os.path.expanduser("~")
    deepface_cache_path = os.path.join(home, ".deepface")
    os.makedirs(deepface_cache_path, exist_ok=True)
    
    preload_models()
