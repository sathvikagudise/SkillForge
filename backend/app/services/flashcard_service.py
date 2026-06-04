from sqlalchemy.orm import Session
from ..models import Flashcard, UserFile, EmbeddingMeta
from typing import List, Dict
from ..services.gemini_service import generate_flashcards
from ..services.embeddings_service import search_similar_chunks
import json

def get_text_blob_for_file(db: Session, file_id: int, max_chars: int = 30000) -> str:
    chunks = db.query(EmbeddingMeta).filter(EmbeddingMeta.file_id == file_id).order_by(EmbeddingMeta.page_num).all()
    if chunks:
        text_blob = "\n\n".join([c.text for c in chunks])
        if len(text_blob) > max_chars:
            text_blob = text_blob[:max_chars]
        return text_blob
    return ""

def create_flashcards_from_file(db: Session, user, file_id: int, count: int = 10) -> List[Dict]:
    file = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == user.id).first()
    if not file:
        raise ValueError("File not found or access denied")

    text_blob = get_text_blob_for_file(db, file_id)
    if not text_blob.strip():
        context_chunks = search_similar_chunks(file.filename, top_k=10)
        text_blob = "\n\n".join([c.get("text", "") for c in context_chunks])

    if not text_blob.strip():
        text_blob = f"Content from {file.filename}"

    raw = generate_flashcards(text_blob, count)
    cards = []
    try:
        parsed = json.loads(raw)
    except Exception:
        parsed = []
        for line in raw.split("\n"):
            if ":" in line:
                q,a = line.split(":",1)
                parsed.append({"question": q.strip(), "answer": a.strip(), "difficulty":"medium"})

    for item in parsed:
        question = item.get("question") or item.get("q")
        answer = item.get("answer") or item.get("a")
        difficulty = item.get("difficulty","medium")
        card = Flashcard(user_id=user.id, question=question, answer=answer, source_file_id=file_id, difficulty=difficulty)
        db.add(card)
        db.commit()
        db.refresh(card)
        cards.append(card)
    return cards

def list_flashcards_for_user(db: Session, user_id: int):
    cards = db.query(Flashcard).filter(Flashcard.user_id == user_id).order_by(Flashcard.created_at.desc()).all()
    return cards

def update_flashcard(db: Session, user_id: int, card_id: int, payload):
    card = db.query(Flashcard).filter(Flashcard.id == card_id, Flashcard.user_id == user_id).first()
    if not card:
        raise ValueError("Card not found")
    card.question = payload.question
    card.answer = payload.answer
    card.difficulty = payload.difficulty or card.difficulty
    db.commit()
    db.refresh(card)
    return card

def delete_flashcard(db: Session, user_id: int, card_id: int):
    card = db.query(Flashcard).filter(Flashcard.id == card_id, Flashcard.user_id == user_id).first()
    if not card:
        raise ValueError("Card not found")
    db.delete(card)
    db.commit()
    return True
