from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..services.gemini_service import summarize_text, generate_flashcards, generate_quiz, grade_answer
from ..services.gemini_service import generate_definition
from ..schemas.ai import SummarizeRequest, SummarizeResponse, FlashcardCreateRequest, FlashcardOut
from ..schemas.quiz import QuizOut
from ..schemas.notes import NoteOut
from ..models import UserFile, EmbeddingMeta, Flashcard, Quiz
from ..utils.auth_dep import get_current_user
from typing import List
import json
import re

router = APIRouter()

def extract_json(text: str):
    text = text.strip()
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Extract from markdown code blocks (```json ... ``` or ``` ... ```)
    m = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass
    # Try to find JSON array or object boundaries
    for start, end in [('[', ']'), ('{', '}')]:
        s = text.find(start)
        if s == -1:
            continue
        e = text.rfind(end)
        if e > s:
            try:
                return json.loads(text[s:e+1])
            except json.JSONDecodeError:
                pass
    raise ValueError(f"Cannot extract JSON from: {text[:200]}")

def get_file_text_blob(file_id: int, db: Session, max_chars: int = 30000) -> str:
    chunks = db.query(EmbeddingMeta).filter(EmbeddingMeta.file_id == file_id).order_by(EmbeddingMeta.page_num).all()
    if not chunks:
        file = db.query(UserFile).filter(UserFile.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        raise HTTPException(status_code=400, detail="No text content found. Process the file first.")
    text_blob = "\n\n".join([c.text for c in chunks])
    if len(text_blob) > max_chars:
        text_blob = text_blob[:max_chars] + "\n\n[truncated...]"
    return text_blob

@router.post("/summarize", response_model=SummarizeResponse)
def summarize(req: SummarizeRequest, db: Session = Depends(get_db)):
    text_blob = get_file_text_blob(req.file_id, db)
    s = summarize_text(text_blob, length=req.length)
    return {"summary": s, "citations": []}

@router.post("/flashcards/generate", response_model=List[FlashcardOut])
def flashcards(req: FlashcardCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    text_blob = get_file_text_blob(req.file_id, db)
    resp_text = generate_flashcards(text_blob, req.count)
    try:
        cards = extract_json(resp_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {e}")
    if not isinstance(cards, list):
        raise HTTPException(status_code=500, detail="AI response is not a list")
    out = []
    for c in cards:
        fc = Flashcard(
            user_id=current_user.id,
            question=c.get("question") or c.get("q", ""),
            answer=c.get("answer") or c.get("a", ""),
            difficulty=c.get("difficulty", "medium"),
            source_file_id=req.file_id
        )
        db.add(fc)
        db.commit()
        db.refresh(fc)
        out.append(FlashcardOut.model_validate(fc))
    return out

@router.post("/define")
def define_term(payload: dict):
    term = (payload or {}).get("term")
    if not term:
        raise HTTPException(status_code=400, detail="No term provided")
    definition = generate_definition(term)
    if not definition:
        raise HTTPException(status_code=500, detail="AI returned empty definition")
    return {"term": term, "definition": definition}

@router.post("/define_many")
def define_many(payload: dict):
    term = (payload or {}).get("term")
    count = int((payload or {}).get("count") or 5)
    if not term:
        raise HTTPException(status_code=400, detail="No term provided")
    try:
        resp_text = generate_flashcards(term, count)
        cards = json.loads(resp_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")
    if not isinstance(cards, list):
        raise HTTPException(status_code=500, detail="AI response is not a list")
    out = []
    for c in cards:
        out.append({
            "question": c.get("question") or c.get("q") or term,
            "answer": c.get("answer") or c.get("a") or "",
            "difficulty": c.get("difficulty", "medium")
        })
    return out

@router.post("/quiz/generate", response_model=QuizOut)
def generate_quiz_endpoint(payload: dict, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    file_id = payload.get("file_id")
    count = payload.get("count", 10)
    text_blob = get_file_text_blob(file_id, db)
    resp = generate_quiz(text_blob, count)
    try:
        qs = extract_json(resp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI quiz response: {e}")
    if not isinstance(qs, list):
        raise HTTPException(status_code=500, detail="AI response is not a list")
    file = db.query(UserFile).filter(UserFile.id == file_id).first()
    filename = file.filename if file else "Unknown"
    quiz = Quiz(user_id=current_user.id, title=f"Quiz for {filename}", questions=qs)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return QuizOut.model_validate(quiz)

@router.post("/notes")
def generate_notes(payload: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    from ..models import Note
    file_id = payload.get("file_id")
    if not file_id:
        raise HTTPException(status_code=400, detail="file_id required")
    text_blob = get_file_text_blob(file_id, db)
    from ..services.gemini_service import generate_flashcards
    resp = generate_flashcards(text_blob, 10)
    notes_content = f"AI-generated notes from file #{file_id}\n\n{resp[:2000]}"
    note = Note(user_id=current_user.id, title=f"Notes for file #{file_id}", content=notes_content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return NoteOut.model_validate(note)

@router.post("/grade")
def grade(req: dict):
    q = req.get("question")
    ref = req.get("reference")
    ua = req.get("answer")
    res = grade_answer(q, ref, ua)
    try:
        return extract_json(res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI grade response: {e}")
