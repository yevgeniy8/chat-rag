"""schemas/chat.py
==================
Pydantic models used by the chat endpoint to validate requests and responses."""

from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

class ChatModeResponse(BaseModel):
    """Single model output enriched with latency metadata."""

    message: str
    latency: int
    mode: Literal["baseline", "rag"]
    semantic_similarity: Optional[float] = Field(
        default=None, description="Semantic similarity to the paired response"
    )


class ChatEvalMetrics(BaseModel):
    """Aggregate metrics stored alongside a chat session."""

    baseline_latency: int = Field(..., description="Latency for the baseline model in ms")
    rag_latency: int = Field(..., description="Latency for the RAG model in ms")
    semantic_similarity: float = Field(..., description="Cosine similarity between model outputs")
    created_at: datetime
    updated_at: datetime


class ChatMessageRecord(BaseModel):
    """A single conversational turn recorded in a session."""

    prompt: str
    timestamp: datetime
    baseline: ChatModeResponse
    rag: ChatModeResponse


class ChatSession(BaseModel):
    """Persistent record of a comparison session."""

    session_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageRecord]
    metrics: ChatEvalMetrics


class ChatDualResponse(BaseModel):
    """Response returned when both baseline and RAG answers are generated."""

    session_id: str
    prompt: str
    timestamp: datetime
    baseline: ChatModeResponse
    rag: ChatModeResponse
    metrics: ChatEvalMetrics


class ChatRequest(BaseModel):
    """Incoming user prompt with optional session metadata."""

    message: str
    session_id: Optional[str] = Field(default=None, description="Existing session identifier")
    top_k: Optional[int] = Field(default=None, description="How many chunks to retrieve")


class CompareRequest(BaseModel):
    query: str


class CompareResponse(BaseModel):
    baseline: str
    rag: str
    latency: int
    similarity: float
