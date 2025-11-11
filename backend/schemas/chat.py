"""schemas/chat.py
==================
Pydantic models used by the chat endpoint to validate requests and responses."""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Incoming user question and configuration flags."""

    message: str
    use_rag: bool = True
    top_k: Optional[int] = Field(default=None, description="How many chunks to retrieve")
    compare: bool = False


class RetrievedContext(BaseModel):
    """Metadata for a single retrieved chunk."""

    file: str
    snippet: str
    score: float


class ChatResponse(BaseModel):
    """Structured response returned to the frontend."""

    message: str
    mode: Literal["rag", "baseline"]
    retrieved_context: List[RetrievedContext]
    avg_similarity: float

class ModeMetrics(BaseModel):
    latency_ms: int
    semantic_similarity: float


class ModeAnswer(BaseModel):
    message: str
    retrieved_context: List[RetrievedContext] = Field(default_factory=list)
    metrics: ModeMetrics


class ChatCompareResponse(BaseModel):
    baseline: ModeAnswer
    rag: ModeAnswer
