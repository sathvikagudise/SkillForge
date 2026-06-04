from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..services.gemini_service import generate_graph
from ..utils.auth_dep import get_current_user
from ..models import UserFile, EmbeddingMeta
from ..schemas.graph import KnowledgeGraphOut, Node, Edge
import json

router = APIRouter()

@router.get("/{file_id}", response_model=KnowledgeGraphOut)
def get_graph(file_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    file = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="file not found")
    chunks = db.query(EmbeddingMeta).filter(EmbeddingMeta.file_id == file_id).order_by(EmbeddingMeta.page_num).limit(20).all()
    if chunks:
        text_blob = "\n\n".join([c.text for c in chunks])
        if len(text_blob) > 15000:
            text_blob = text_blob[:15000]
    else:
        text_blob = f"Document: {file.filename}"
    raw = generate_graph(text_blob)
    try:
        parsed = json.loads(raw)
        nodes = parsed.get("nodes", [])
        edges = parsed.get("edges", [])
    except Exception:
        nodes = [{"id":"n1","label":file.filename}]
        edges = []
    return {"nodes": nodes, "edges": edges}
