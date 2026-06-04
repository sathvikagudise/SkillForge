# app/routes/plagiarism.py
from fastapi import APIRouter, Depends, HTTPException
from ..utils.auth_dep import get_current_user
from ..services.plagiarism_service import internal_similarity_check
from ..db import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/check")
def check_plagiarism(payload: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    payload: { text: "..." }
    Returns: list of similar chunks in user's corpus (internal check)
    """
    text = payload.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    results = internal_similarity_check(text, top_k=8)
    return {"matches": results}
