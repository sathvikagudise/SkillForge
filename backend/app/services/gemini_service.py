"""
Gemini service — all functions now delegate to AI Adapter.
Kept for backward compatibility with existing route imports.
"""
from .ai_adapter import get_adapter
import logging

logger = logging.getLogger(__name__)

def _adapter():
    return get_adapter()

def summarize_text(text: str, length: str = "short"):
    return _adapter().summarize(text, length)

def generate_flashcards(text: str, count: int = 10):
    return _adapter().generate_flashcards(text, count)

def generate_quiz(text: str, count: int = 10):
    return _adapter().generate_quiz(text, count)

def grade_answer(question: str, reference: str, user_answer: str):
    return _adapter().grade_answer(question, reference, user_answer)

def generate_definition(term: str):
    return _adapter().define_term(term)

def generate_graph(text: str):
    return _adapter().generate_graph(text)

def generate_learning_path(prompt_text: str):
    return _adapter().generate_learning_path(prompt_text)
