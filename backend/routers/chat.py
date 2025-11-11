"""routers/chat.py
==================
Contains the chat endpoint that compares baseline LLM responses with
retrieval-augmented answers."""

from __future__ import annotations

from time import perf_counter
from typing import List

from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool
from loguru import logger

from schemas.chat import ChatAnalysisResponse, ChatRequest, RetrievedContext
from services import llm, rag_pipeline
from services.metrics import count_tokens, summarize_metrics
from settings import Settings, get_settings

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatAnalysisResponse)
async def chat(request: ChatRequest, settings: Settings = Depends(get_settings)) -> ChatAnalysisResponse:
    """Return baseline and RAG answers alongside evaluation metrics."""

    logger.info("Processing analytical chat request")
    top_k = request.top_k or settings.default_top_k

    retrieved = await run_in_threadpool(rag_pipeline.retrieve, request.message, top_k)
    rag_context = rag_pipeline.build_context(retrieved)

    baseline_start = perf_counter()
    baseline_message = await run_in_threadpool(llm.generate_baseline, request.message)
    baseline_latency = perf_counter() - baseline_start

    rag_start = perf_counter()
    rag_message = await run_in_threadpool(llm.generate_with_context, request.message, rag_context)
    rag_latency = perf_counter() - rag_start

    metrics = summarize_metrics(baseline_message, rag_message)
    avg_similarity = rag_pipeline.average_similarity(retrieved)

    retrieved_context = _build_retrieved_context(retrieved)

    logger.info(
        "Analytical metrics computed | baseline_latency=%.3fs | rag_latency=%.3fs | cosine=%.3f | bleu=%.3f | rouge=%.3f",
        baseline_latency,
        rag_latency,
        metrics["cosine_similarity"],
        metrics["bleu"],
        metrics["rouge"],
    )

    return ChatAnalysisResponse(
        baseline_message=baseline_message,
        rag_message=rag_message,
        baseline_latency=baseline_latency,
        rag_latency=rag_latency,
        baseline_tokens=count_tokens(baseline_message),
        rag_tokens=count_tokens(rag_message),
        cosine_similarity=metrics["cosine_similarity"],
        bleu=metrics["bleu"],
        rouge=metrics["rouge"],
        avg_similarity=avg_similarity,
        retrieved_context=retrieved_context,
    )


def _build_retrieved_context(chunks: List[dict]) -> List[RetrievedContext]:
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
