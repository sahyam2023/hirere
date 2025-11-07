from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .user import Base
import datetime

class ProctorLog(Base):
    __tablename__ = 'proctor_logs'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    exam_id = Column(Integer, ForeignKey('exams.id'), nullable=False)
    session_id = Column(String, index=True, nullable=False)
    event_type = Column(String, nullable=False)
    image_path = Column(String, nullable=True)
    audio_path = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")
    exam = relationship("Exam")

class UserFace(Base):
    __tablename__ = 'user_faces'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    embedding_vector = Column(JSON, nullable=False)
    image_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")
