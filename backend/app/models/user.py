from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship, column_property
from sqlalchemy.sql.expression import exists
from .proctor import UserFace
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)

    face_embedding = relationship("UserFace", uselist=False, back_populates="user")
    assignments = relationship("ExamAssignment", back_populates="user")

    is_face_registered = column_property(
        exists().where(UserFace.user_id == id)
    )
