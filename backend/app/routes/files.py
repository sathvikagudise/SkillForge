# app/routes/files.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models
from sqlalchemy import inspect
from ..schemas.pdf import UploadPresignOut, ProcessStart
from ..tasks.pdf_tasks import process_pdf_task
from ..services.pdf_processor import process_pdf_local_path
from ..utils.auth_dep import get_current_user
from ..utils.local_storage import save_upload_file, is_allowed_filename, get_local_public_path
from ..config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
def list_files(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        files = db.query(models.UserFile).filter(models.UserFile.user_id == current_user.id).order_by(models.UserFile.id.desc()).all()
        return [{"id": f.id, "filename": f.filename, "processed": getattr(f, 'processed', False), "created_at": str(getattr(f, 'created_at', ''))} for f in files]
    except Exception as e:
        logger.exception("Failed to list files")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{file_id}")
def get_file(file_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    file = db.query(models.UserFile).filter(models.UserFile.id == file_id, models.UserFile.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return {"id": file.id, "filename": file.filename, "processed": getattr(file, 'processed', False), "created_at": str(getattr(file, 'created_at', ''))}

# Direct upload endpoint — frontend posts file with Authorization header
@router.post("/upload")
def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Validate file type
    try:
        logger.info("Incoming upload request: user_id=%s filename=%s content_type=%s", getattr(current_user, 'id', None), getattr(file, 'filename', None), getattr(file, 'content_type', None))
        if not is_allowed_filename(file.filename):
            raise HTTPException(status_code=400, detail="Only PDF uploads allowed")
        # Optional: check size by reading file.file.tell() — but UploadFile is streaming; better enforced on frontend or reverse proxy
        # Save file locally
        saved_path = save_upload_file(file, current_user.id, file.filename)
        # Create DB record
        gcs_like_path = get_local_public_path(saved_path)  # for compatibility, we keep same DB field name
        # Inspect actual DB columns for 'user_files' table so we only insert supported fields
        try:
            engine = db.get_bind()
            inspector = inspect(engine)
            cols = [c['name'] for c in inspector.get_columns('user_files')]
        except Exception:
            cols = ['user_id', 'filename', 'gcs_path', 'processed', 'pages']

        # Build kwargs with only columns that actually exist in the database
        user_file_kwargs = {
            'user_id': current_user.id,
            'filename': file.filename,
            'gcs_path': gcs_like_path,
        }
        if 'processed' in cols:
            user_file_kwargs['processed'] = False

        logger.info("Creating UserFile with columns: %s. Available DB columns: %s", list(user_file_kwargs.keys()), cols)
        
        user_file = models.UserFile(**user_file_kwargs)
        db.add(user_file)
        try:
            db.commit()
            db.refresh(user_file)
            logger.info("Successfully created UserFile id=%s", user_file.id)
        except Exception as commit_error:
            db.rollback()
            logger.error("Database commit failed. Error: %s", commit_error, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Database error: {str(commit_error)}")
        # Process file synchronously so it's ready immediately
        try:
            total_chunks = process_pdf_local_path(saved_path, user_file, db_session=db)
            logger.info("File processed: id=%s chunks=%s", user_file.id, total_chunks)
        except Exception as e:
            logger.warning("File processing failed: %s", e, exc_info=True)
        return {"file_id": user_file.id, "path": gcs_like_path}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Upload failed: %s", e)
        # Provide a concise error message to the client while logging the full traceback
        raise HTTPException(status_code=500, detail="Upload failed on server")

@router.post("/{file_id}/process")
def start_processing(file_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    file = db.query(models.UserFile).filter(models.UserFile.id == file_id, models.UserFile.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="file not found")
    # If file.gcs_path is a local path, pass to task
    saved_path = file.gcs_path
    process_pdf_task.delay(file.id, saved_path)
    return {"status": "processing_started"}
