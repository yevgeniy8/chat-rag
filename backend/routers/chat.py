"""routers/chat.py
==================
Contains the chat endpoint that compares baseline LLM responses with
retrieval-augmented answers."""

from __future__ import annotations

from datetime import datetime
from time import perf_counter

import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from loguru import logger

from schemas.chat import (
    ChatDualResponse,
    ChatModeResponse,
    ChatRequest,
    CompareRequest,
    CompareResponse,
)
from services import embeddings, llm, rag_pipeline
from services.session_store import get_session_store
from settings import Settings, get_settings

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatDualResponse)
async def chat(request: ChatRequest, settings: Settings = Depends(get_settings)) -> ChatDualResponse:
    """Generate baseline and RAG responses together with latency metrics."""

    prompt = request.message.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    logger.info("Processing dual chat request")

    baseline_start = perf_counter()
    baseline_text = await run_in_threadpool(llm.generate_baseline, prompt)
    baseline_latency = int((perf_counter() - baseline_start) * 1000)

    top_k = request.top_k or settings.default_top_k
    retrieved = await run_in_threadpool(rag_pipeline.retrieve, prompt, top_k)
    context = rag_pipeline.build_context(retrieved)

    rag_start = perf_counter()
    rag_text = await run_in_threadpool(llm.generate_with_context, prompt, context)
    rag_latency = int((perf_counter() - rag_start) * 1000)

    similarity = _cosine_similarity(baseline_text, rag_text)

    timestamp = datetime.utcnow()
    baseline_block = ChatModeResponse(message=baseline_text, latency=baseline_latency, mode="baseline")
    rag_block = ChatModeResponse(
        message=rag_text,
        latency=rag_latency,
        mode="rag",
        semantic_similarity=similarity,
    )

    session_store = get_session_store()
    session = session_store.add_message(
        session_id=request.session_id,
        prompt=prompt,
        timestamp=timestamp,
        baseline=baseline_block,
        rag=rag_block,
    )

    return ChatDualResponse(
        session_id=session.session_id,
        prompt=prompt,
        timestamp=timestamp,
        baseline=baseline_block,
        rag=rag_block,
        metrics=session.metrics,
    )


def _cosine_similarity(text_a: str, text_b: str) -> float:
    if not text_a or not text_b:
        return 0.0
    vectors = embeddings.embed_texts([text_a, text_b])
    if vectors.size == 0:
        return 0.0
    a, b = vectors
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


@router.post("/compare", response_model=CompareResponse)
async def compare_chat(
    payload: CompareRequest, settings: Settings = Depends(get_settings)
) -> CompareResponse:
    """Return baseline and RAG responses for the same query."""

    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    logger.info("Running comparison query")
    start = perf_counter()

    baseline = await run_in_threadpool(llm.generate_baseline, query)
    top_k = settings.default_top_k
    retrieved = await run_in_threadpool(rag_pipeline.retrieve, query, top_k)
    context = rag_pipeline.build_context(retrieved)
    rag_response = await run_in_threadpool(llm.generate_with_context, query, context)

    latency_ms = int((perf_counter() - start) * 1000)
    similarity = _cosine_similarity(baseline, rag_response)

    return CompareResponse(
        baseline=baseline,
        rag=rag_response,
        latency=latency_ms,
        similarity=similarity,
    )
