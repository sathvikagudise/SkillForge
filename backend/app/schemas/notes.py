# app/schemas/notes.py
from pydantic import BaseModel, Field
from typing import Optional, Any


class NoteCreate(BaseModel):
    title: str
    content: str
    metadata: Optional[Any] = None


class NoteOut(BaseModel):
    id: int
    title: str
    content: str
    # The DB column is mapped to attribute `metadata_` on the ORM model to avoid
    # clashing with SQLAlchemy's Base.metadata. Use an alias so Pydantic reads
    # the ORM attribute `metadata_` and exposes it as `metadata` in the JSON.
    metadata: Optional[Any] = Field(None, alias="metadata_")

    class Config:
        from_attributes = True
        populate_by_name = True
