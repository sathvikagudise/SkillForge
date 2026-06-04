from pydantic import BaseModel
from typing import Optional

class UploadPresignOut(BaseModel):
    file_id: int
    upload_url: str
    gcs_path: Optional[str]

class ProcessStart(BaseModel):
    file_id: int
