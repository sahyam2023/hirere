import insightface
import numpy as np
import os

# Initialize the FaceAnalysis model
# This will download the model if it's not already cached
# We are using the 'buffalo_l' model which includes SCRFD for detection and ArcFace for recognition.
# The model will run on the GPU using CUDAExecutionProvider.
face_analyzer = insightface.app.FaceAnalysis(
    name="buffalo_l",
    providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
)
face_analyzer.prepare(ctx_id=0, det_size=(640, 640))

def get_face_analyzer():
    """
    Returns the initialized FaceAnalysis model instance.
    """
    return face_analyzer
