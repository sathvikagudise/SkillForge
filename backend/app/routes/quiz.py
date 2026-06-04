# app/routes/quiz.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Quiz
from ..schemas.quiz import QuizCreateRequest, QuizOut, QuizQuestion
from ..utils.auth_dep import get_current_user
from ..services.quiz_service import create_quiz_from_file, grade_quiz_submission, get_quiz_by_id, list_quizzes_for_user
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def quiz_to_out(quiz: Quiz) -> QuizOut:
    """Convert Quiz ORM model to QuizOut schema, avoiding metadata column issues."""
    return QuizOut(
        id=quiz.id,
        title=quiz.title,
        questions=quiz.questions or []
    )

@router.post("/generate", response_model=QuizOut)
def generate_quiz(payload: QuizCreateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        quiz = create_quiz_from_file(db, current_user, payload.file_id, payload.count)
        return quiz_to_out(quiz)
    except Exception as e:
        logger.exception("Failed to generate quiz")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[QuizOut])
def list_quizzes(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        quizzes = list_quizzes_for_user(db, current_user.id)
        return [quiz_to_out(q) for q in quizzes]
    except Exception as e:
        logger.exception("Failed to list quizzes")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        quiz = get_quiz_by_id(db, current_user.id, quiz_id)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        return quiz_to_out(quiz)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get quiz")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db.delete(quiz)
    db.commit()
    return {"status": "deleted"}

@router.post("/{quiz_id}/submit")
def submit_quiz(quiz_id: int, payload: Dict[str, Any], db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    payload: { answers: { question_index: selected_option_index, ... } }
    Returns: { score: int, total: int, correct: int, details: [...] }
    """
    try:
        answers = payload.get("answers", {})
        result = grade_quiz_submission(db, current_user.id, quiz_id, answers)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Failed to submit quiz")
        raise HTTPException(status_code=500, detail=str(e))
