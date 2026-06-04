# app/routes/learning_path.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..utils.auth_dep import get_current_user
from ..models import UserFile
from ..services.gemini_service import generate_learning_path  # add to gemini_service
from ..schemas.learning_path import LearningPathOut
import json

router = APIRouter()

@router.get("/{user_id}", response_model=LearningPathOut)
def get_learning_path(user_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    # Gather user's uploaded files / topics
    files = db.query(UserFile).filter(UserFile.user_id == user_id).all()
    file_list = [f.filename for f in files]
    prompt_text = f"User has the following materials: {file_list}. Generate a learning path graph (nodes+edges) and recommended next topic."
    raw = generate_learning_path(prompt_text)
    try:
        parsed = json.loads(raw)
        nodes = parsed.get("nodes", [])
        edges = parsed.get("edges", [])
        recommended_next = parsed.get("recommended_next")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate learning path: {e}")
    return {"nodes": nodes, "edges": edges, "recommended_next": recommended_next}
