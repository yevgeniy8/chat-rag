"""schemas/chat.py
==================
Pydantic models used by the chat endpoint to validate requests and responses."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Incoming user question and optional retrieval configuration."""

    message: str
    top_k: Optional[int] = Field(default=None, description="How many chunks to retrieve")


class RetrievedContext(BaseModel):
    """Metadata for a single retrieved chunk."""

    file: str
    snippet: str
    score: float


class ChatAnalysisResponse(BaseModel):
    """Combined baseline and RAG outputs with evaluation metrics."""

    baseline_message: str
    rag_message: str
    baseline_latency: float
    rag_latency: float
    baseline_tokens: int
    rag_tokens: int
    cosine_similarity: float
    bleu: float
    rouge: float
    avg_similarity: float
    retrieved_context: List[RetrievedContext]
