# app/services/plagiarism_service.py
from .embeddings_service import search_similar_chunks
from typing import List, Dict

def internal_similarity_check(text: str, top_k: int = 5) -> List[Dict]:
    """
    Return top matches in corpus for given text with similarity scores and excerpts.
    """
    results = search_similar_chunks(text, top_k=top_k)
    # Format results for API
    formatted = []
    for r in results:
        formatted.append({
            "file_id": r.get("file_id"),
            "page_num": r.get("page_num"),
            "chunk_idx": r.get("chunk_idx"),
            "score": r.get("_score"),
            "excerpt": r.get("text")
        })
    return formatted
