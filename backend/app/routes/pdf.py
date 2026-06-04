from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import UserFile, EmbeddingMeta
from ..utils.auth_dep import get_current_user
from typing import List, Dict

router = APIRouter()

@router.get("/{file_id}/text")
def get_pdf_text(file_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    file = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    chunks = db.query(EmbeddingMeta).filter(EmbeddingMeta.file_id == file_id).order_by(EmbeddingMeta.page_num, EmbeddingMeta.chunk_id).all()
    if not chunks:
        return {"file_id": file_id, "text": "", "pages": 0, "chunks": 0}
    full_text = "\n\n".join([c.text for c in chunks])
    return {
        "file_id": file_id,
        "text": full_text,
        "pages": max(c.page_num or 0 for c in chunks) if chunks else 0,
        "chunks": len(chunks)
    }

@router.get("/{file_id}/chunks")
def get_pdf_chunks(file_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    file = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    chunks = db.query(EmbeddingMeta).filter(EmbeddingMeta.file_id == file_id).order_by(EmbeddingMeta.page_num, EmbeddingMeta.chunk_id).all()
    return [
        {"chunk_id": c.chunk_id, "page_num": c.page_num, "text": c.text[:500] + ("..." if len(c.text) > 500 else "")}
        for c in chunks
    ]

@router.get("/{file_id}/stats")
def get_pdf_stats(file_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    file = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    chunks = db.query(EmbeddingMeta).filter(EmbeddingMeta.file_id == file_id).all()
    total_chars = sum(len(c.text) for c in chunks)
    return {
        "file_id": file_id,
        "filename": file.filename,
        "processed": file.processed,
        "total_chunks": len(chunks),
        "total_characters": total_chars,
        "pages": max((c.page_num or 0) for c in chunks) if chunks else 0
    }
