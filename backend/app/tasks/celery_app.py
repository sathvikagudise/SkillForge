from celery import Celery
from ..config import settings
import os

celery = Celery("worker", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
celery.config_from_object("celeryconfig")
