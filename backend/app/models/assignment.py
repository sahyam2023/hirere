from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExamAssignment(Base):
    __tablename__ = 'exam_assignments'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    exam_id = Column(Integer, ForeignKey('exams.id'), nullable=False)

    user = relationship("User", back_populates="assignments")
    exam = relationship("Exam", back_populates="assignments")

    __table_args__ = (UniqueConstraint('user_id', 'exam_id', name='_user_exam_uc'),)
