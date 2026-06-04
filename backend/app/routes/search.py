# app/routes/search.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..utils.auth_dep import get_current_user
from ..services.search_service import semantic_search
from typing import List, Dict

router = APIRouter()

@router.get("/", response_model=List[Dict])
def search(q: str = Query(..., min_length=1), top_k: int = 5, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    results = semantic_search(q, top_k=top_k)
    return results

@router.post("/notes", response_model=List[Dict])
def search_notes(payload: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    query = payload.get("query", "")
    if not query:
        raise HTTPException(status_code=400, detail="No query provided")
    from ..models import Note
    notes = db.query(Note).filter(Note.user_id == current_user.id, Note.content.ilike(f"%{query}%")).all()
    return [{"id": n.id, "title": n.title, "content": n.content[:200]} for n in notes]
