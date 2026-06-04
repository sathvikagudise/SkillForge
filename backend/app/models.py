from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON, Float
from sqlalchemy.sql import func
from .db import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    google_id = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    files = relationship("UserFile", back_populates="owner")

class UserFile(Base):
    __tablename__ = "user_files"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String(512))
    gcs_path = Column(String(1024))
    processed = Column(Boolean, default=False)
    pages = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="files")

class Flashcard(Base):
    __tablename__ = "flashcards"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question = Column(Text)
    answer = Column(Text)
    source_file_id = Column(Integer, ForeignKey("user_files.id"), nullable=True)
    difficulty = Column(String(32), default="medium")
    # SM-2 Spaced Repetition fields
    easiness_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    next_review_date = Column(DateTime(timezone=True), nullable=True)
    last_quality = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255))
    questions = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255))
    content = Column(Text)
    metadata_ = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class EmbeddingMeta(Base):
    __tablename__ = "embeddings"
    id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey("user_files.id"), nullable=True)
    chunk_id = Column(String(128), nullable=False)
    page_num = Column(Integer, nullable=True)
    text = Column(Text)
    vector_index = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Node(Base):
    __tablename__ = "kg_nodes"
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content_ref = Column(String(255), nullable=True)
    estimated_time = Column(Integer, nullable=True)
    difficulty = Column(String(32), default="medium")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Edge(Base):
    __tablename__ = "kg_edges"
    id = Column(Integer, primary_key=True)
    from_node_id = Column(Integer, ForeignKey("kg_nodes.id"), nullable=False)
    to_node_id = Column(Integer, ForeignKey("kg_nodes.id"), nullable=False)
    relation_type = Column(String(32), default="prereq")
    weight = Column(Float, default=1.0)

class LearnerState(Base):
    __tablename__ = "kg_learner_state"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    node_id = Column(Integer, ForeignKey("kg_nodes.id"), nullable=False)
    status = Column(String(32), default="locked")
    score = Column(Float, nullable=True)
    last_reviewed = Column(DateTime(timezone=True), nullable=True)
