from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import UserFile, EmbeddingMeta
from ..services.gemini_service import summarize_text
from ..utils.auth_dep import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class SummarizeDocRequest(BaseModel):
    file_id: int
    length: Optional[str] = "short"

class SummarizeDocResponse(BaseModel):
    summary: str
    file_id: int
    length: str

@router.post("/document", response_model=SummarizeDocResponse)
def summarize_document(payload: SummarizeDocRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    file = db.query(UserFile).filter(UserFile.id == payload.file_id, UserFile.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    chunks = db.query(EmbeddingMeta).filter(EmbeddingMeta.file_id == payload.file_id).order_by(EmbeddingMeta.page_num).all()
    if not chunks:
        raise HTTPException(status_code=400, detail="No text content found for this file. Has it been processed?")
    text_blob = "\n\n".join([c.text for c in chunks])
    if len(text_blob) > 30000:
        text_blob = text_blob[:30000] + "\n\n[truncated...]"
    summary = summarize_text(text_blob, length=payload.length)
    return SummarizeDocResponse(summary=summary, file_id=payload.file_id, length=payload.length)
