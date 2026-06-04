# app/schemas/learning_path.py
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class LearningNode(BaseModel):
    id: str
    title: str
    topic: Optional[str] = None
    estimated_time_min: Optional[int] = None
    prerequisites: Optional[List[str]] = []

class LearningPathOut(BaseModel):
    nodes: List[LearningNode]
    edges: List[Dict[str, str]]
    recommended_next: Optional[str] = None
