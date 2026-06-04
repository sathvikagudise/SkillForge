# app/tasks/cleanup_tasks.py
from .worker import celery
import os
import time
from ..utils.logger import get_logger

logger = get_logger(__name__)

@celery.task(name="cleanup_temp_files")
def cleanup_temp_files(threshold_seconds: int = 24*3600):
    tmpdir = "/tmp"
    now = time.time()
    removed = 0
    for fname in os.listdir(tmpdir):
        path = os.path.join(tmpdir, fname)
        try:
            mtime = os.path.getmtime(path)
            if now - mtime > threshold_seconds:
                if os.path.isfile(path):
                    os.remove(path)
                    removed += 1
        except Exception as e:
            logger.info(f"cleanup error {e}")
    return {"removed": removed}
