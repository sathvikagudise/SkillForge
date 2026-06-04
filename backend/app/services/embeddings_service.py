"""
FAISS vector search service for semantic chunk retrieval.
Generates embeddings via Gemini embedding API, indexes with FAISS,
and persists to disk for reload across restarts.
"""
import os
import pickle
import numpy as np
import logging
from typing import List, Dict, Optional, Any
from .ai_adapter import get_adapter

logger = logging.getLogger(__name__)

INDEX_DIR = "data/faiss_index"
INDEX_FILE = os.path.join(INDEX_DIR, "index.faiss")
META_FILE = os.path.join(INDEX_DIR, "meta.pkl")
os.makedirs(INDEX_DIR, exist_ok=True)

_EMBED_DIM = 3072  # Gemini embedding-001 output dimension

try:
    import faiss
    _FAISS_AVAILABLE = True
except ImportError:
    _FAISS_AVAILABLE = False
    faiss = None

class VectorStore:
    def __init__(self):
        self.index = None
        self.chunks: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if not _FAISS_AVAILABLE:
            return
        try:
            if os.path.exists(INDEX_FILE) and os.path.exists(META_FILE):
                self.index = faiss.read_index(INDEX_FILE)
                with open(META_FILE, "rb") as f:
                    self.chunks = pickle.load(f)
                logger.info(f"Loaded FAISS index with {self.index.ntotal} vectors, {len(self.chunks)} chunks")
        except Exception as e:
            logger.warning(f"Could not load existing FAISS index: {e}")
            self.index = None

    def _save(self):
        if not _FAISS_AVAILABLE or self.index is None:
            return
        try:
            faiss.write_index(self.index, INDEX_FILE)
            with open(META_FILE, "wb") as f:
                pickle.dump(self.chunks, f)
        except Exception as e:
            logger.warning(f"Failed to save FAISS index: {e}")

    def _ensure_index(self):
        if self.index is None:
            if not _FAISS_AVAILABLE:
                raise RuntimeError("faiss package not installed")
            self.index = faiss.IndexFlatIP(_EMBED_DIM)

    def _get_embedding(self, text: str) -> Optional[np.ndarray]:
        if not _FAISS_AVAILABLE:
            return None
        adapter = get_adapter()
        vec = adapter.get_embedding(text)
        if vec is None:
            return None
        arr = np.array(vec, dtype=np.float32)
        if arr.shape[0] != _EMBED_DIM:
            arr = np.resize(arr, _EMBED_DIM)
        faiss.normalize_L2(arr.reshape(1, -1))
        return arr

    def add(self, text: str, metadata: dict):
        self._ensure_index()
        emb = self._get_embedding(text)
        if emb is None:
            logger.warning("Skipping chunk — no embedding generated")
            return
        self.index.add(emb.reshape(1, _EMBED_DIM).astype(np.float32))
        self.chunks.append({"text": text, **metadata})
        self._save()

    def search(self, text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if not _FAISS_AVAILABLE or self.index is None or self.index.ntotal == 0:
            return self.chunks[:top_k]
        emb = self._get_embedding(text)
        if emb is None:
            return self.chunks[:top_k]
        scores, indices = self.index.search(emb.reshape(1, _EMBED_DIM).astype(np.float32), top_k)
        results = []
        for idx, score in zip(indices[0], scores[0]):
            if 0 <= idx < len(self.chunks):
                results.append({**self.chunks[idx], "similarity": float(score)})
        return results

# Lazy singleton
_store: Optional[VectorStore] = None

def get_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
    return _store

def index_text_chunk(chunk_text: str, metadata: dict):
    try:
        get_store().add(chunk_text, metadata)
    except Exception as e:
        logger.warning(f"index_text_chunk failed: {e}")

def search_similar_chunks(text: str, top_k: int = 5) -> List[Dict[str, Any]]:
    try:
        return get_store().search(text, top_k=top_k)
    except Exception as e:
        logger.warning(f"search_similar_chunks failed: {e}")
        return []
