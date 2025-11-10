from pydantic import BaseModel

class FramePayload(BaseModel):
    exam_id: int
    image_base64: str
    session_id: str
