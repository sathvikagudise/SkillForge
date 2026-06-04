# app/utils/chunk.py
from typing import List
import tiktoken  # optional: for token-aware chunking; may not be installed in your env

def chunk_text_simple(text: str, max_chars: int = 1500) -> List[str]:
    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    chunks = []
    cur = ""
    for p in paragraphs:
        if len(cur) + len(p) + 1 < max_chars:
            if cur:
                cur += "\n" + p
            else:
                cur = p
        else:
            if cur:
                chunks.append(cur)
            cur = p
    if cur:
        chunks.append(cur)
    return chunks

# token-aware chunking fallback (will try to import tiktoken; if not available, use simple)
def chunk_text_token_aware(text: str, max_tokens: int = 800) -> List[str]:
    try:
        enc = tiktoken.get_encoding("cl100k_base")
        tokens = enc.encode(text)
        chunks = []
        cur_tokens = []
        for tok in tokens:
            cur_tokens.append(tok)
            if len(cur_tokens) >= max_tokens:
                chunks.append(enc.decode(cur_tokens))
                cur_tokens = []
        if cur_tokens:
            chunks.append(enc.decode(cur_tokens))
        return chunks
    except Exception:
        return chunk_text_simple(text, max_chars=2000)
