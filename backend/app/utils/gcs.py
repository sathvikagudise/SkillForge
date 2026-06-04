from google.cloud import storage
from ..config import settings
import os
import json
from urllib.parse import quote_plus

# Make sure GOOGLE_APPLICATION_CREDENTIALS env var points to settings.GCS_CREDENTIALS_JSON
if settings.GCS_CREDENTIALS_JSON:
    os.environ.setdefault("GOOGLE_APPLICATION_CREDENTIALS", settings.GCS_CREDENTIALS_JSON)

def get_gcs_client():
    return storage.Client(project=settings.GCS_PROJECT)

def generate_signed_upload_url(blob_path: str, content_type: str = "application/pdf", expiration: int = 3600):
    client = get_gcs_client()
    bucket = client.bucket(settings.GCS_BUCKET)
    blob = bucket.blob(blob_path)
    url = blob.generate_signed_url(expiration=expiration, method="PUT", content_type=content_type)
    return url

def upload_file_from_local(local_path: str, blob_path: str):
    client = get_gcs_client()
    bucket = client.bucket(settings.GCS_BUCKET)
    blob = bucket.blob(blob_path)
    blob.upload_from_filename(local_path)
    return f"gs://{settings.GCS_BUCKET}/{blob_path}"

def get_blob_public_url(blob_path: str):
    return f"https://storage.googleapis.com/{settings.GCS_BUCKET}/{quote_plus(blob_path)}"
