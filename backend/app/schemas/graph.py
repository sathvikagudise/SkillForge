# app/schemas/graph.py
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class Node(BaseModel):
    id: str
    label: str
    metadata: Optional[Dict[str, Any]] = None

class Edge(BaseModel):
    source: str
    target: str
    label: Optional[str] = None

class KnowledgeGraphOut(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
