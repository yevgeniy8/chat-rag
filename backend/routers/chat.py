"""routers/chat.py
==================
Contains the chat endpoint that compares baseline LLM responses with
retrieval-augmented answers."""

from __future__ import annotations

from time import monotonic
from typing import List, Sequence, Union

import numpy as np
from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool
from loguru import logger

from schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatCompareResponse,
    ModeAnswer,
    ModeMetrics,
    RetrievedContext,
)
from services import embeddings, llm, rag_pipeline
from settings import Settings, get_settings

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=Union[ChatResponse, ChatCompareResponse])
async def chat(
    request: ChatRequest, settings: Settings = Depends(get_settings)
) -> Union[ChatResponse, ChatCompareResponse]:
    """Return either a baseline or RAG response depending on ``use_rag``."""

    top_k = request.top_k or settings.default_top_k

    if request.compare:
        logger.info("Processing comparison chat request")
        return await _run_comparison(request.message, top_k)

    if not request.use_rag:
        logger.info("Processing baseline chat request")
        message = await run_in_threadpool(llm.generate_baseline, request.message)
        return ChatResponse(message=message, mode="baseline", retrieved_context=[], avg_similarity=0.0)

    logger.info("Processing RAG chat request")
    retrieved = await run_in_threadpool(rag_pipeline.retrieve, request.message, top_k)
    context = rag_pipeline.build_context(retrieved)
    message = await run_in_threadpool(llm.generate_with_context, request.message, context)
    avg_score = rag_pipeline.average_similarity(retrieved)

    retrieved_context: List[RetrievedContext] = [
        RetrievedContext(
            file=chunk.get("meta", {}).get("file", "unknown"),
            snippet=chunk.get("text", ""),
            score=chunk.get("score", 0.0),
        )
        for chunk in retrieved
    ]

    return ChatResponse(message=message, mode="rag", retrieved_context=retrieved_context, avg_similarity=avg_score)


def _semantic_similarity(answer: str, reference: str) -> float:
    if not answer or not reference:
        return 0.0
    vectors = embeddings.embed_texts([answer, reference])
    if vectors.size == 0:
        return 0.0
    answer_vector, reference_vector = vectors
    denom = float(np.linalg.norm(answer_vector) * np.linalg.norm(reference_vector))
    if denom == 0:
        return 0.0
    return float(np.dot(answer_vector, reference_vector) / denom)


async def _run_comparison(message: str, top_k: int) -> ChatCompareResponse:
    retrieved = await run_in_threadpool(rag_pipeline.retrieve, message, top_k)
    rag_context = _build_retrieved_context(retrieved)
    reference_text = "\n\n".join(_safe_chunk_text(chunk) for chunk in retrieved if _safe_chunk_text(chunk))

    baseline_start = monotonic()
    baseline_message = await run_in_threadpool(llm.generate_baseline, message)
    baseline_latency = int((monotonic() - baseline_start) * 1000)

    rag_start = monotonic()
    rag_prompt_context = rag_pipeline.build_context(retrieved)
    rag_message = await run_in_threadpool(llm.generate_with_context, message, rag_prompt_context)
    rag_latency = int((monotonic() - rag_start) * 1000)

    evaluation_reference = reference_text
    if not evaluation_reference:
        fallback_retrieved = await run_in_threadpool(rag_pipeline.retrieve, message, max(1, top_k))
        evaluation_reference = "\n\n".join(
            _safe_chunk_text(chunk) for chunk in fallback_retrieved if _safe_chunk_text(chunk)
        )

    baseline_similarity = _semantic_similarity(baseline_message, evaluation_reference)
    rag_similarity = _semantic_similarity(rag_message, evaluation_reference)

    logger.info(
        "Baseline metrics | latency_ms=%d | semantic_similarity=%.4f",
        baseline_latency,
        baseline_similarity,
    )
    logger.info(
        "RAG metrics | latency_ms=%d | semantic_similarity=%.4f",
        rag_latency,
        rag_similarity,
    )

    baseline_metrics = ModeMetrics(latency_ms=baseline_latency, semantic_similarity=baseline_similarity)
    rag_metrics = ModeMetrics(latency_ms=rag_latency, semantic_similarity=rag_similarity)

    return ChatCompareResponse(
        baseline=ModeAnswer(message=baseline_message, metrics=baseline_metrics),
        rag=ModeAnswer(message=rag_message, retrieved_context=rag_context, metrics=rag_metrics),
    )


def _build_retrieved_context(chunks: Sequence[dict]) -> List[RetrievedContext]:
    contexts: List[RetrievedContext] = []
    for chunk in chunks:
        score_value = chunk.get("score", 0.0)
        try:
            score = float(score_value)
        except (TypeError, ValueError):  # pragma: no cover - defensive guard
            score = 0.0
        contexts.append(
            RetrievedContext(
                file=chunk.get("meta", {}).get("file", "unknown"),
                snippet=_safe_chunk_text(chunk),
                score=score,
            )
        )
    return contexts


def _safe_chunk_text(chunk: dict) -> str:
    return (chunk.get("text") or "").strip()
