from pydantic import BaseModel
from typing import Optional, List

class NodeOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    content_ref: Optional[str]
    estimated_time: Optional[int]
    difficulty: Optional[str]

    class Config:
        from_attributes = True

class EdgeOut(BaseModel):
    id: int
    from_node_id: int
    to_node_id: int
    relation_type: str

    class Config:
        from_attributes = True

class LearnerStateOut(BaseModel):
    node_id: int
    status: str
    score: Optional[float]
    last_reviewed: Optional[str]

    class Config:
        from_attributes = True

class GraphOut(BaseModel):
    nodes: List[NodeOut]
    edges: List[EdgeOut]
    learner_states: List[LearnerStateOut]
