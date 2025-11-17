import logging
import os
from app.core.face_analysis import get_face_analyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def preload_models():
    """
    Downloads and caches the machine learning models required by the application.
    This ensures that the models are ready before the web server starts,
    preventing timeouts and crashes during the first request.
    """
    logger.info("Starting model pre-loading for InsightFace...")

    try:
        # This will initialize the FaceAnalysis model and download it if necessary
        get_face_analyzer()
        logger.info("InsightFace model pre-loaded successfully.")

    except Exception as e:
        logger.error(f"An error occurred during model pre-loading: {e}", exc_info=True)
        # Exit with a non-zero status code to indicate failure
        exit(1)


if __name__ == "__main__":
    preload_models()
