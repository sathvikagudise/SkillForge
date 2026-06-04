# app/schemas/quiz.py
from pydantic import BaseModel
from typing import List, Optional, Any

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    explanation: Optional[str] = None
    source_page: Optional[int] = None

class QuizCreateRequest(BaseModel):
    file_id: int
    count: int = 10

class QuizOut(BaseModel):
    id: int
    title: str
    questions: List[QuizQuestion]

    class Config:
        from_attributes = True
