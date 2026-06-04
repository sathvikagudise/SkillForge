# app/routes/calendar.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Note  # reuse Note model? better to create CalendarEvent model; we'll use Note table as placeholder if needed
from ..schemas.calendar import CalendarEventCreate, CalendarEventOut
from ..utils.auth_dep import get_current_user
from ..models import Note as CalendarModel  # If Calendar model not created yet, you should add CalendarEvent model in models.py

router = APIRouter()

# NOTE: If you want a dedicated calendar table, add a CalendarEvent model to models.py. For now, store events in Note table with a special metadata flag.
@router.post("/", response_model=CalendarEventOut)
def create_event(payload: CalendarEventCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # store as Note with metadata.meta_type = 'calendar'
    from ..models import Note
    note = Note(user_id=current_user.id, title=payload.title, content=payload.description or "", metadata_={
        "type": "calendar_event",
        "start": payload.start.isoformat(),
        "end": payload.end.isoformat() if payload.end else None,
        "recur": payload.recur
    })
    db.add(note); db.commit(); db.refresh(note)
    return {
        "id": note.id,
        "title": note.title,
        "start": payload.start,
        "end": payload.end,
        "description": note.content
    }

@router.get("/", response_model=list[CalendarEventOut])
def list_events(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    from ..models import Note
    events = db.query(Note).filter(Note.user_id == current_user.id, Note.metadata_.isnot(None)).all()
    out = []
    for e in events:
        md = e.metadata_ or {}
        if md.get("type") == "calendar_event":
            out.append({
                "id": e.id,
                "title": e.title,
                "start": md.get("start"),
                "end": md.get("end"),
                "description": e.content
            })
    return out
