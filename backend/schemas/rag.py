"""Schemas for RAG interactions, uploads, and history."""

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel


class UploadResponse(BaseModel):
    file_id: int
    original_name: str
    stored_name: str
    created_at: datetime


class RagRequest(BaseModel):
    question: str
    top_k: int | None = None


class RagResponse(BaseModel):
    answer: str
    context: str
    retrieved_chunks: List[str]


class FileItem(BaseModel):
    id: int
    original_name: str
    stored_name: str
    created_at: datetime


class HistoryItem(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
