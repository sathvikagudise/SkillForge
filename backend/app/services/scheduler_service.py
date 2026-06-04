"""
Enhanced SM-2 Spaced Repetition Algorithm
Implements the extended SM-2 from the paper with:
  - AI-derived difficulty estimates (D)
  - Learner confidence scores (C)
  - Contextual factors (L)
  - Performance consistency across related items (P)
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from ..models import Flashcard
from ..services.gemini_service import generate_definition
import math

def compute_ai_difficulty(flashcard: Flashcard) -> float:
    content = f"{flashcard.question} {flashcard.answer}"
    length_factor = min(len(content) / 500, 1.0)
    difficulty_map = {"easy": 0.2, "medium": 0.5, "hard": 0.8}
    base = difficulty_map.get(flashcard.difficulty or "medium", 0.5)
    return min(1.0, base + length_factor * 0.2)

def get_learner_confidence(quality: int, response_time_ms: Optional[int] = None) -> float:
    if quality == 5:
        base = 1.0
    elif quality == 4:
        base = 0.8
    elif quality == 3:
        base = 0.6
    elif quality == 2:
        base = 0.4
    elif quality == 1:
        base = 0.2
    else:
        base = 0.0
    if response_time_ms is not None and response_time_ms > 0:
        time_factor = max(0, 1.0 - (response_time_ms / 30000))
        return (base + time_factor) / 2
    return base

def compute_context_factor() -> float:
    now = datetime.now(timezone.utc)
    hour = now.hour
    if 6 <= hour < 12:
        time_factor = 0.9
    elif 12 <= hour < 18:
        time_factor = 1.0
    elif 18 <= hour < 22:
        time_factor = 0.8
    else:
        time_factor = 0.6
    return min(1.0, max(0.0, time_factor))

def calculate_consistency(flashcard: Flashcard, db: Session, user_id: int) -> float:
    similar = db.query(Flashcard).filter(
        Flashcard.user_id == user_id,
        Flashcard.id != flashcard.id,
        Flashcard.difficulty == flashcard.difficulty,
        Flashcard.review_count > 0
    ).limit(10).all()
    if not similar:
        return 1.0
    avg_quality = sum(s.last_quality or 3 for s in similar) / len(similar)
    return 0.5 + (avg_quality / 10)

def update_easiness_factor(
    ef: float,
    quality: int,
    difficulty: float,
    confidence: float,
    context: float,
    alpha: float = 0.05,
    beta: float = 0.02,
    gamma: float = 0.01
) -> float:
    q = float(quality)
    new_ef = ef + (0.1 - (5 - q) * (0.08 + 0.02 * (5 - q))) - alpha * difficulty + beta * confidence + gamma * context
    return max(1.3, min(2.5, new_ef))

def calculate_next_review(
    flashcard: Flashcard,
    quality: int,
    db: Session,
    user_id: int,
    confidence: Optional[float] = None,
    response_time_ms: Optional[int] = None
) -> dict:
    difficulty = compute_ai_difficulty(flashcard)
    if confidence is None:
        confidence = get_learner_confidence(quality, response_time_ms)
    context = compute_context_factor()
    ef = flashcard.easiness_factor or 2.5
    new_ef = update_easiness_factor(ef, quality, difficulty, confidence, context)
    consistency = calculate_consistency(flashcard, db, user_id)

    if quality < 3:
        new_interval = 1
    else:
        interval = flashcard.interval or 0
        if interval == 0:
            new_interval = 1
        elif interval == 1:
            new_interval = 6
        else:
            new_interval = round(interval * new_ef * consistency)

    next_review = datetime.now(timezone.utc) + timedelta(days=new_interval)
    return {
        "easiness_factor": round(new_ef, 2),
        "interval": new_interval,
        "next_review_date": next_review,
        "review_count": (flashcard.review_count or 0) + 1,
        "difficulty_score": round(difficulty, 2),
        "confidence_score": round(confidence, 2),
        "context_score": round(context, 2),
        "consistency_score": round(consistency, 2),
    }

def get_due_cards(db: Session, user_id: int, limit: int = 50) -> List[Flashcard]:
    now = datetime.now(timezone.utc)
    cards = db.query(Flashcard).filter(
        Flashcard.user_id == user_id,
        Flashcard.next_review_date.is_(None) | (Flashcard.next_review_date <= now)
    ).order_by(Flashcard.next_review_date.is_(None).desc(), Flashcard.next_review_date.asc()).limit(limit).all()
    return cards
