from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Callable
from ..config import settings
import json
import logging
import time
import hashlib
import re

logger = logging.getLogger(__name__)

PROMPT_TEMPLATES: Dict[str, str] = {
    "summarize": "Summarize the following text to a {length} summary. Include key points and page references:\n\n{text}",
    "flashcards": "Create {count} concise flashcards from the text below. Return ONLY a valid JSON array. No markdown, no code fences, no explanation. JSON keys: question, answer, difficulty (easy/medium/hard), source_page.\n\nText:\n{text}",
    "quiz": "Generate {count} multiple choice questions from the text below. Return ONLY a valid JSON array. No markdown, no code fences, no explanation. Each object keys: question, options (array of 4 strings), correct_index (0-3), explanation, source_page.\n\nText:\n{text}",
    "grade": """Grade the user answer. Return ONLY valid JSON with keys: score (0-100), correct (boolean), explanation (string). No markdown, no code fences.
Question: {question}
Reference: {reference}
User answer: {user_answer}""",
    "define": "Provide a concise, clear definition for the term '{term}'. Keep it one paragraph (2-3 sentences) and include an example if helpful. Plain text only.",
    "graph": """Extract a knowledge graph from the following text. Return ONLY valid JSON. No markdown, no code fences.
{{"nodes": [{{"id":"id","label":"concept","metadata":{{"description":"..."}}}}], "edges": [{{"source":"id","target":"id","label":"relationship"}}]}}
Only include explicitly mentioned concepts.
Text: {text}""",
    "learning_path": """Based on the user materials and goals, generate a personalized learning path.
Return ONLY valid JSON. No markdown, no code fences.
{{"nodes": [{{"id":"n1","title":"Topic","topic":"area","estimated_time_min":30,"prerequisites":[]}}], "edges": [{{"source":"n1","target":"n2","label":"prereq"}}], "recommended_next": "n1"}}
User context: {context}""",
}

HEAVY_TASKS = {"summarize", "quiz", "grade", "graph", "learning_path"}

_cache: Dict[str, str] = {}

def _cache_key(task: str, **params) -> str:
    raw = task + "|" + json.dumps(params, sort_keys=True, default=str)
    return hashlib.md5(raw.encode()).hexdigest()

class BaseAIAdapter(ABC):
    @abstractmethod
    def generate(self, task: str, prompt: str, temperature: float = 0.2, max_tokens: int = 200) -> str:
        ...

    def summarize(self, text: str, length: str = "short") -> str:
        prompt = PROMPT_TEMPLATES["summarize"].format(text=text, length=length)
        return self.generate("summarize", prompt, temperature=0.2, max_tokens=800)

    def generate_flashcards(self, text: str, count: int = 10) -> str:
        prompt = PROMPT_TEMPLATES["flashcards"].format(text=text, count=count)
        return self.generate("flashcards", prompt, temperature=0.3, max_tokens=1000)

    def generate_quiz(self, text: str, count: int = 10) -> str:
        prompt = PROMPT_TEMPLATES["quiz"].format(text=text, count=count)
        return self.generate("quiz", prompt, temperature=0.25, max_tokens=1200)

    def grade_answer(self, question: str, reference: str, user_answer: str) -> str:
        prompt = PROMPT_TEMPLATES["grade"].format(question=question, reference=reference, user_answer=user_answer)
        return self.generate("grade", prompt, temperature=0.0, max_tokens=300)

    def define_term(self, term: str) -> str:
        prompt = PROMPT_TEMPLATES["define"].format(term=term)
        return self.generate("define", prompt, temperature=0.2, max_tokens=200)

    def generate_graph(self, text: str) -> str:
        prompt = PROMPT_TEMPLATES["graph"].format(text=text)
        return self.generate("graph", prompt, temperature=0.2, max_tokens=1500)

    def generate_learning_path(self, context: str) -> str:
        prompt = PROMPT_TEMPLATES["learning_path"].format(context=context)
        return self.generate("learning_path", prompt, temperature=0.3, max_tokens=1500)

    def get_embedding(self, text: str) -> Optional[List[float]]:
        return None

class GeminiAdapter(BaseAIAdapter):
    def __init__(self, api_key: str, fast_model: str = "gemini-2.0-flash"):
        import google.generativeai as genai
        self._genai = genai
        self._genai.configure(api_key=api_key)
        self.fast_model = fast_model.replace("models/", "")
        self.max_retries = 3
        self.base_delay = 1.0

    def _call(self, model_name: str, prompt: str, temperature: float, max_tokens: int) -> str:
        model_obj = self._genai.GenerativeModel(model_name)
        config = self._genai.GenerationConfig(temperature=temperature, max_output_tokens=max_tokens)
        last_exc = None
        for attempt in range(self.max_retries):
            try:
                resp = model_obj.generate_content(prompt, generation_config=config)
                if hasattr(resp, 'text') and resp.text:
                    return resp.text
                return str(resp) if resp else ""
            except Exception as e:
                logger.warning(f"Gemini call failed (attempt {attempt+1}/{self.max_retries}): {e}")
                last_exc = e
                if attempt < self.max_retries - 1:
                    time.sleep(self.base_delay * (2 ** attempt))
        logger.error(f"Gemini API failed after {self.max_retries} retries")
        raise RuntimeError(f"AI generation failed after {self.max_retries} retries") from last_exc

    def generate(self, task: str, prompt: str, temperature: float = 0.2, max_tokens: int = 200) -> str:
        ck = _cache_key(task, prompt=prompt, temperature=temperature, max_tokens=max_tokens)
        if ck in _cache:
            return _cache[ck]
        result = self._call(self.fast_model, prompt, temperature, max_tokens)
        _cache[ck] = result
        return result

    def get_embedding(self, text: str) -> Optional[List[float]]:
        try:
            result = self._genai.embed_content(model="models/gemini-embedding-001", content=text)
            if isinstance(result, dict):
                emb = result.get('embedding')
                if emb is not None:
                    return emb if isinstance(emb, list) else (emb.get('values') if isinstance(emb, dict) else None)
            if hasattr(result, 'embedding'):
                emb = result.embedding
                if hasattr(emb, 'values'):
                    return emb.values
                if isinstance(emb, list):
                    return emb
        except Exception as e:
            logger.warning(f"Embedding generation failed: {e}")
        return None

class DeepSeekAdapter(BaseAIAdapter):
    def __init__(self, api_key: str, model: str = "deepseek-chat", base_url: str = "https://api.deepseek.com"):
        from openai import OpenAI
        self._client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self.max_retries = 3
        self.base_delay = 1.0

    def _call(self, prompt: str, temperature: float, max_tokens: int) -> str:
        last_exc = None
        for attempt in range(self.max_retries):
            try:
                resp = self._client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                content = resp.choices[0].message.content
                return content or ""
            except Exception as e:
                logger.warning(f"DeepSeek call failed (attempt {attempt+1}/{self.max_retries}): {e}")
                last_exc = e
                if attempt < self.max_retries - 1:
                    time.sleep(self.base_delay * (2 ** attempt))
        logger.error(f"DeepSeek API failed after {self.max_retries} retries")
        raise RuntimeError(f"AI generation failed after {self.max_retries} retries") from last_exc

    def generate(self, task: str, prompt: str, temperature: float = 0.2, max_tokens: int = 200) -> str:
        ck = _cache_key(task, prompt=prompt, temperature=temperature, max_tokens=max_tokens)
        if ck in _cache:
            return _cache[ck]
        result = self._call(prompt, temperature, max_tokens)
        _cache[ck] = result
        return result

class OllamaAdapter(BaseAIAdapter):
    def __init__(self, model: str = "deepseek-coder:6.7b", base_url: str = "http://localhost:11434/v1"):
        from openai import OpenAI
        self._client = OpenAI(api_key="ollama", base_url=base_url)
        self.model = model
        self.max_retries = 2
        self.base_delay = 1.0

    def _call(self, prompt: str, temperature: float, max_tokens: int) -> str:
        last_exc = None
        for attempt in range(self.max_retries):
            try:
                resp = self._client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                content = resp.choices[0].message.content
                return content or ""
            except Exception as e:
                logger.warning(f"Ollama call failed (attempt {attempt+1}/{self.max_retries}): {e}")
                last_exc = e
                if attempt < self.max_retries - 1:
                    time.sleep(self.base_delay * (2 ** attempt))
        logger.error(f"Ollama API failed after {self.max_retries} retries")
        raise RuntimeError(f"AI generation failed after {self.max_retries} retries") from last_exc

    def generate(self, task: str, prompt: str, temperature: float = 0.2, max_tokens: int = 200) -> str:
        ck = _cache_key(task, prompt=prompt, temperature=temperature, max_tokens=max_tokens)
        if ck in _cache:
            return _cache[ck]
        result = self._call(prompt, temperature, max_tokens)
        _cache[ck] = result
        return result

_adapter_instance: Optional[BaseAIAdapter] = None

def get_adapter() -> BaseAIAdapter:
    global _adapter_instance
    if _adapter_instance is not None:
        return _adapter_instance

    if settings.OLLAMA_BASE_URL:
        import urllib.request
        try:
            urllib.request.urlopen(settings.OLLAMA_BASE_URL.replace("/v1", "/api/tags"), timeout=5)
            _adapter_instance = OllamaAdapter(
                model=settings.OLLAMA_MODEL,
                base_url=settings.OLLAMA_BASE_URL,
            )
            logger.info("Initialized OllamaAdapter")
        except Exception:
            logger.warning("Ollama not reachable, trying next provider")
    elif settings.DEEPSEEK_API_KEY:
        _adapter_instance = DeepSeekAdapter(
            api_key=settings.DEEPSEEK_API_KEY,
            model=settings.DEEPSEEK_MODEL,
            base_url=settings.DEEPSEEK_BASE_URL,
        )
        logger.info("Initialized DeepSeekAdapter")
    elif settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key":
        _adapter_instance = GeminiAdapter(
            api_key=settings.GEMINI_API_KEY,
            fast_model=settings.GEMINI_FAST_MODEL,
        )
        logger.info("Initialized GeminiAdapter")
    else:
        raise RuntimeError("No AI provider available. Run Ollama locally or set DEEPSEEK_API_KEY/GEMINI_API_KEY in .env.")
    return _adapter_instance

def _check_ollama() -> bool:
    import urllib.request
    try:
        urllib.request.urlopen("http://localhost:11434/api/tags", timeout=2)
        return True
    except Exception:
        return False
