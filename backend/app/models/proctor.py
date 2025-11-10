from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime
from pgvector.sqlalchemy import Vector

class ProctorLog(Base):
    __tablename__ = 'proctor_logs'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    exam_id = Column(Integer, ForeignKey('exams.id'), nullable=False)
    session_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    event_type = Column(String)  # e.g. 'face_absent', 'multi_face'
    message = Column(Text)

    user = relationship("User")
    exam = relationship("Exam")

class UserFace(Base):
    __tablename__ = 'user_faces'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    embedding_vector = Column(Vector(4096), nullable=False)
    image_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="face_embedding")
