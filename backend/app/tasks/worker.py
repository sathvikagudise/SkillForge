# app/tasks/worker.py
"""
Helper to run celery worker.
Usage:
  celery -A app.tasks.worker.celery worker --loglevel=info
"""
from celery import Celery
from ..config import settings

celery = Celery("learnbuddy_worker", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
celery.config_from_object("celeryconfig")
