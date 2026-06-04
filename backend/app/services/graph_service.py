# app/services/graph_service.py
from typing import Dict, Any, List
from ..services.gemini_service import generate_graph
import json

def build_graph_from_text(text: str) -> Dict[str, Any]:
    """
    Use Gemini to extract nodes/edges JSON. Parse and sanitize.
    """
    raw = generate_graph(text)
    try:
        parsed = json.loads(raw)
        nodes = parsed.get("nodes", [])
        edges = parsed.get("edges", [])
    except Exception as e:
        raise ValueError(f"Failed to parse knowledge graph from AI: {e}")
    # basic sanitation
    nodes_clean = []
    for n in nodes:
        nodes_clean.append({
            "id": str(n.get("id") or n.get("label")[:8]),
            "label": n.get("label") or n.get("id"),
            "metadata": n.get("metadata", {})
        })
    edges_clean = []
    for e in edges:
        edges_clean.append({
            "source": e.get("source"),
            "target": e.get("target"),
            "label": e.get("label")
        })
    return {"nodes": nodes_clean, "edges": edges_clean}
