# app/routes/notes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Note
from ..schemas.notes import NoteCreate, NoteOut
from ..utils.auth_dep import get_current_user
from typing import List

router = APIRouter()

@router.post("/", response_model=NoteOut)
def create_note(payload: NoteCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        note = Note(user_id=current_user.id, title=payload.title, content=payload.content, metadata=payload.metadata)
        db.add(note)
        db.commit()
        db.refresh(note)
        # Return a Pydantic model instance to avoid serializing ORM internals
        return NoteOut.model_validate(note)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[NoteOut])
def list_notes(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        notes = db.query(Note).filter(Note.user_id == current_user.id).order_by(Note.created_at.desc()).all()
        # Convert to Pydantic models to avoid FastAPI trying to json-encode SQLAlchemy internals
        return [NoteOut.model_validate(n) for n in notes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{note_id}", response_model=NoteOut)
def update_note(note_id: int, payload: NoteCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        note.title = payload.title
        note.content = payload.content
        note.metadata = payload.metadata
        db.commit()
        db.refresh(note)
        return NoteOut.model_validate(note)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        db.delete(note)
        db.commit()
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
