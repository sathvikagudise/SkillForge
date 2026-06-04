# app/schemas/calendar.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CalendarEventCreate(BaseModel):
    title: str
    start: datetime
    end: Optional[datetime] = None
    description: Optional[str] = None
    recur: Optional[str] = None

class CalendarEventOut(BaseModel):
    id: int
    title: str
    start: datetime
    end: Optional[datetime]
    description: Optional[str]

    class Config:
        from_attributes = True
