from sqlalchemy.orm import Session
from ..models import Quiz, UserFile, EmbeddingMeta
from ..services.gemini_service import generate_quiz, grade_answer
from ..services.embeddings_service import search_similar_chunks
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def get_text_blob_for_file(db: Session, file_id: int, max_chars: int = 30000) -> str:
    chunks = db.query(EmbeddingMeta).filter(EmbeddingMeta.file_id == file_id).order_by(EmbeddingMeta.page_num).all()
    if chunks:
        text_blob = "\n\n".join([c.text for c in chunks])
        if len(text_blob) > max_chars:
            text_blob = text_blob[:max_chars]
        return text_blob
    return ""

def create_quiz_from_file(db: Session, user, file_id: int, count: int = 10) -> Quiz:
    file = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == user.id).first()
    if not file:
        raise ValueError("File not found or access denied")

    text_blob = get_text_blob_for_file(db, file_id)
    if not text_blob.strip():
        chunks = search_similar_chunks(file.filename, top_k=10)
        text_blob = "\n\n".join([c.get("text","") for c in chunks])

    if not text_blob.strip():
        raise ValueError(f"No text content found for file '{file.filename}'. Process the file first.")

    raw = generate_quiz(text_blob, count)

    try:
        parsed = json.loads(raw)
        if not isinstance(parsed, list):
            parsed = [parsed]
    except Exception as e:
        raise ValueError(f"Failed to generate quiz: AI response could not be parsed: {e}")

    validated = []
    for item in parsed[:count]:
        q = {
            "question": item.get("question") or "Question",
            "options": item.get("options") or ["A", "B", "C", "D"],
            "correct_index": item.get("correct_index", 0),
            "explanation": item.get("explanation", ""),
            "source_page": item.get("source_page"),
        }
        validated.append(q)

    quiz_title = f"Quiz: {file.filename.replace('.pdf', '').replace('_', ' ')}"
    quiz = Quiz(user_id=user.id, title=quiz_title, questions=validated[:count])
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return quiz

def list_quizzes_for_user(db: Session, user_id: int):
    return db.query(Quiz).filter(Quiz.user_id==user_id).order_by(Quiz.created_at.desc()).all()

def get_quiz_by_id(db: Session, user_id: int, quiz_id: int):
    q = db.query(Quiz).filter(Quiz.id==quiz_id, Quiz.user_id==user_id).first()
    return q

def grade_quiz_submission(db: Session, user_id: int, quiz_id: int, answers: Dict[str, Any]) -> Dict[str, Any]:
    quiz = get_quiz_by_id(db, user_id, quiz_id)
    if not quiz:
        raise ValueError("Quiz not found")

    questions = quiz.questions or []
    total = len(questions)
    correct = 0
    details = []

    for idx, q in enumerate(questions):
        user_ans_idx = answers.get(str(idx))
        if user_ans_idx is not None:
            try:
                user_ans_idx = int(user_ans_idx)
            except (ValueError, TypeError):
                user_ans_idx = None

        correct_index = q.get("correct_index", 0)
        is_correct = (user_ans_idx is not None and user_ans_idx == correct_index)

        explanation = q.get("explanation", "")

        if is_correct:
            correct += 1

        details.append({
            "index": idx,
            "is_correct": is_correct,
            "user_answer": user_ans_idx,
            "correct_index": correct_index,
            "explanation": explanation
        })

    score_percent = int((correct / total) * 100) if total > 0 else 0

    return {
        "score": score_percent,
        "total": total,
        "correct": correct,
        "details": details,
        "summary": f"{correct}/{total} correct ({score_percent}%)"
    }
