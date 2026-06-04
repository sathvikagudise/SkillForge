# app/tasks/pdf_tasks.py
from .celery_app import celery
from ..db import SessionLocal
from ..models import UserFile
from ..services.pdf_processor import process_pdf_local_path
import os

@celery.task(name="process_pdf_task")
def process_pdf_task(file_id: int, local_path: str = None):
    db = SessionLocal()
    try:
        file = db.query(UserFile).filter(UserFile.id == file_id).first()
        if not file:
            return {"error": "file not found"}
        if not local_path:
            local_path = file.gcs_path  # fallback
        if not local_path or not os.path.exists(local_path):
            return {"error": "local file not found"}
        total = process_pdf_local_path(local_path, file, db_session=db)
        db.add(file); db.commit()
        return {"status":"ok","chunks": total}
    finally:
        db.close()
