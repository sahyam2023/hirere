from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from .proctor import UserFace
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)

    face_embedding = relationship("UserFace", uselist=False, back_populates="user", lazy="joined")
    assignments = relationship("ExamAssignment", back_populates="user")

    @hybrid_property
    def is_face_registered(self):
        return self.face_embedding is not None
