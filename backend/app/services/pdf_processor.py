import fitz
import os
from .embeddings_service import index_text_chunk
from ..models import EmbeddingMeta

def process_pdf_local_path(local_path: str, file_db_obj, db_session=None):
    doc = fitz.open(local_path)
    total_chunks = 0
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text().strip()
        if not text:
            continue
        chunks = chunk_text(text)
        for idx, chunk in enumerate(chunks):
            metadata = {
                "file_id": file_db_obj.id,
                "page_num": page_num + 1,
                "chunk_idx": idx
            }
            try:
                index_text_chunk(chunk, metadata)
                total_chunks += 1
            except Exception as e:
                print("Embedding error:", e)
            if db_session:
                try:
                    meta = EmbeddingMeta(
                        file_id=file_db_obj.id,
                        chunk_id=f"p{page_num+1}_c{idx}",
                        page_num=page_num + 1,
                        text=chunk,
                        vector_index=total_chunks - 1
                    )
                    db_session.add(meta)
                except Exception as e:
                    print("DB save error:", e)
    file_db_obj.processed = True
    if db_session:
        try:
            db_session.commit()
        except Exception as e:
            print("Commit error:", e)
    return total_chunks

def chunk_text(text, max_chars=1500):
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
