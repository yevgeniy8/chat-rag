from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from pydantic import BaseModel, Field


class EvaluationMetrics(BaseModel):
    baseline: Dict[str, Any]
    rag: Dict[str, Any]


class EvaluationSaveRequest(BaseModel):
    question: str
    rag_answer: str
    baseline_answer: str
    metrics: EvaluationMetrics
    retrieved_chunks: List[Any]
    model_baseline: str = Field(..., description="Model identifier for baseline generation")
    model_rag: str = Field(..., description="Model identifier for RAG generation")


class EvaluationResult(EvaluationSaveRequest):
    id: str
    created_at: datetime | str


class EvaluationSummary(BaseModel):
    id: str
    question: str
    created_at: datetime | str
