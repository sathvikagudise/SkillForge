from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class FlashcardCreate(BaseModel):
    question: str
    answer: str
    difficulty: Optional[str] = "medium"

class FlashcardOut(BaseModel):
    id: int
    question: str
    answer: str
    difficulty: Optional[str]
    easiness_factor: Optional[float] = 2.5
    interval: Optional[int] = 0
    review_count: Optional[int] = 0
    next_review_date: Optional[datetime] = None
    last_quality: Optional[int] = None
    source_file_id: Optional[int] = None

    class Config:
        from_attributes = True

class ReviewRequest(BaseModel):
    quality: int = Field(..., ge=0, le=5, description="Quality of recall: 0=complete blackout, 5=perfect response")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Learner self-reported confidence")
    response_time_ms: Optional[int] = None

class ReviewResponse(BaseModel):
    id: int
    quality: int
    easiness_factor: float
    interval: int
    next_review_date: datetime
    review_count: int

class DueCardsResponse(BaseModel):
    cards: List[FlashcardOut]
    total: int
