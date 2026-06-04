# app/services/search_service.py
from ..services.embeddings_service import search_similar_chunks
from typing import List, Dict

def semantic_search(query: str, top_k: int = 5) -> List[Dict]:
    """
    Return top matching chunks for a natural language query.
    """
    results = search_similar_chunks(query, top_k=top_k)
    # Map to safe output
    out = []
    for r in results:
        out.append({
            "file_id": r.get("file_id"),
            "page_num": r.get("page_num"),
            "chunk_idx": r.get("chunk_idx"),
            "score": r.get("_score"),
            "text": r.get("text")
        })
    return out
