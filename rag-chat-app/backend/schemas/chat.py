"""schemas/chat.py
==================
Pydantic models used by the chat endpoint to validate requests and responses.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from settings import settings


class ChatRequest(BaseModel):
    """Incoming user question and configuration flags."""

    message: str
    use_rag: bool
    top_k: Optional[int] = Field(default=None, description="How many chunks to retrieve")


class RetrievedContext(BaseModel):
    """Metadata for a single retrieved chunk."""

    file: str
    snippet: str
    score: float


class ChatResponse(BaseModel):
    """Structured response returned to the frontend."""

    message: str
    mode: str
    retrieved_context: List[RetrievedContext]
    avg_similarity: float
