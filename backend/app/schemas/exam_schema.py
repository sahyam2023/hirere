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
