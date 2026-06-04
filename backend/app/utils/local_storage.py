# app/utils/local_storage.py
import os
from pathlib import Path
import shutil
from werkzeug.utils import secure_filename

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./data/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf"}  # extend if needed

def is_allowed_filename(filename: str) -> bool:
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS

def save_upload_file(file_obj, user_id: int, filename: str) -> str:
    """
    Save a FastAPI UploadFile to local path and return the saved absolute path.
    """
    safe_name = secure_filename(filename)
    user_dir = Path(UPLOAD_DIR) / f"user_{user_id}"
    user_dir.mkdir(parents=True, exist_ok=True)
    import time
    timestamp = int(time.time() * 1000)  # milliseconds for uniqueness
    out_path = user_dir / f"{timestamp}_{safe_name}"
    # write file
    with open(out_path, "wb") as f:
        shutil.copyfileobj(file_obj.file, f)
    return str(out_path)

def get_local_public_path(saved_path: str) -> str:
    """
    Returns a path/URL you can store in DB as reference. For local dev we return the filesystem path.
    """
    return saved_path

def remove_local_file(path: str):
    try:
        os.remove(path)
    except Exception:
        pass
