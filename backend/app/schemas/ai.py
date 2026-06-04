from pydantic import BaseModel, Field
from typing import List, Optional, Any

class SummarizeRequest(BaseModel):
    file_id: int
    length: Optional[str] = "short"  # short/medium/long

class SummarizeResponse(BaseModel):
    summary: str
    citations: Optional[List[Any]] = None

class FlashcardCreateRequest(BaseModel):
    file_id: int
    count: int = 10

class FlashcardCreateSingle(BaseModel):
    question: str
    answer: str
    difficulty: Optional[str] = "medium"

class FlashcardOut(BaseModel):
    id: int
    question: str
    answer: str
    difficulty: Optional[str]
    # Don't include metadata in the response - it's optional and can cause issues
    # If needed later, map it with: metadata: Optional[Any] = Field(None, alias="metadata_")

    class Config:
        from_attributes = True
        populate_by_name = True
