from pydantic import BaseModel
from typing import List, Dict, Any

class QuestionSchema(BaseModel):
    text: str
    options: Dict[str, str]
    correct_option: str
    marks: int

class ExamSchema(BaseModel):
    title: str
    description: str
    duration_minutes: int
    questions: List[QuestionSchema]

class SubmissionSchema(BaseModel):
    exam_id: int
    answers: Dict[int, str]
    duration_seconds: int

class ExamResponseSchema(BaseModel):
    id: int
    title: str
    description: str
    duration_minutes: int
    owner_id: int
    is_active: bool

    class Config:
        orm_mode = True

class QuestionResponseSchema(BaseModel):
    id: int
    text: str
    options: Dict[str, str]

    class Config:
        orm_mode = True

class ExamDetailSchema(ExamResponseSchema):
    questions: List[QuestionResponseSchema]

class AdminStatsSchema(BaseModel):
    total_users: int
    total_exams: int
    total_submissions: int

class ExamUpdateSchema(BaseModel):
    title: str
    description: str
    duration_minutes: int
    is_active: bool

class AssignmentSchema(BaseModel):
    user_id: int
