from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import Flashcard as FlashcardModel
from ..schemas.ai import FlashcardCreateRequest, FlashcardOut, FlashcardCreateSingle
from ..schemas.flashcards import ReviewRequest, ReviewResponse, DueCardsResponse
from ..utils.auth_dep import get_current_user
from ..services.flashcard_service import create_flashcards_from_file, list_flashcards_for_user, update_flashcard, delete_flashcard
from ..services.scheduler_service import calculate_next_review, get_due_cards
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=FlashcardOut)
def create_flashcard(payload: FlashcardCreateSingle, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        fc = FlashcardModel(user_id=current_user.id, question=payload.question, answer=payload.answer, difficulty=payload.difficulty)
        db.add(fc)
        db.commit()
        db.refresh(fc)
        return FlashcardOut(
            id=fc.id, question=fc.question, answer=fc.answer,
            difficulty=fc.difficulty or "medium",
            easiness_factor=fc.easiness_factor, interval=fc.interval,
            review_count=fc.review_count, next_review_date=fc.next_review_date,
            last_quality=fc.last_quality, source_file_id=fc.source_file_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create flashcard")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[FlashcardOut])
def list_flashcards(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        cards = list_flashcards_for_user(db, current_user.id)
        result = []
        for c in cards:
            result.append(FlashcardOut(
                id=c.id, question=c.question, answer=c.answer,
                difficulty=c.difficulty or "medium",
                easiness_factor=c.easiness_factor, interval=c.interval,
                review_count=c.review_count, next_review_date=c.next_review_date,
                last_quality=c.last_quality, source_file_id=c.source_file_id
            ))
        return result
    except Exception as e:
        logger.exception("Failed to list flashcards")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate", response_model=List[FlashcardOut])
def generate_flashcards_route(payload: FlashcardCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        cards = create_flashcards_from_file(db, current_user, payload.file_id, payload.count)
        result = []
        for c in cards:
            result.append(FlashcardOut(
                id=c.id, question=c.question, answer=c.answer,
                difficulty=c.difficulty or "medium",
                easiness_factor=c.easiness_factor, interval=c.interval,
                review_count=c.review_count, next_review_date=c.next_review_date,
                last_quality=c.last_quality, source_file_id=c.source_file_id
            ))
        return result
    except Exception as e:
        logger.exception("Failed to generate flashcards")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/due", response_model=DueCardsResponse)
def list_due_cards(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        cards = get_due_cards(db, current_user.id, limit=limit)
        result = []
        for c in cards:
            result.append(FlashcardOut(
                id=c.id, question=c.question, answer=c.answer,
                difficulty=c.difficulty or "medium",
                easiness_factor=c.easiness_factor, interval=c.interval,
                review_count=c.review_count, next_review_date=c.next_review_date,
                last_quality=c.last_quality, source_file_id=c.source_file_id
            ))
        return {"cards": result, "total": len(result)}
    except Exception as e:
        logger.exception("Failed to list due cards")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{card_id}/review", response_model=ReviewResponse)
def review_card(card_id: int, payload: ReviewRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        card = db.query(FlashcardModel).filter(FlashcardModel.id == card_id, FlashcardModel.user_id == current_user.id).first()
        if not card:
            raise HTTPException(status_code=404, detail="Flashcard not found")
        result = calculate_next_review(
            flashcard=card,
            quality=payload.quality,
            db=db,
            user_id=current_user.id,
            confidence=payload.confidence,
            response_time_ms=payload.response_time_ms
        )
        card.easiness_factor = result["easiness_factor"]
        card.interval = result["interval"]
        card.next_review_date = result["next_review_date"]
        card.review_count = result["review_count"]
        card.last_quality = payload.quality
        db.commit()
        db.refresh(card)
        return ReviewResponse(
            id=card.id, quality=payload.quality,
            easiness_factor=card.easiness_factor, interval=card.interval,
            next_review_date=card.next_review_date, review_count=card.review_count
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to review flashcard")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{card_id}", response_model=FlashcardOut)
def update_card(card_id: int, payload: FlashcardCreateSingle, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        c = update_flashcard(db, current_user.id, card_id, payload)
        return FlashcardOut(
            id=c.id, question=c.question, answer=c.answer,
            difficulty=c.difficulty or "medium",
            easiness_factor=c.easiness_factor, interval=c.interval,
            review_count=c.review_count, next_review_date=c.next_review_date,
            last_quality=c.last_quality, source_file_id=c.source_file_id
        )
    except Exception as e:
        logger.exception("Failed to update flashcard")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        delete_flashcard(db, current_user.id, card_id)
        return {"status": "deleted"}
    except Exception as e:
        logger.exception("Failed to delete flashcard")
        raise HTTPException(status_code=500, detail=str(e))
