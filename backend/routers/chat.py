"""routers/chat.py
==================
Contains the chat endpoint that compares baseline LLM responses with
retrieval-augmented answers."""

from __future__ import annotations

from typing import List
from time import perf_counter

import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from loguru import logger

from schemas.chat import (
    ChatRequest,
    ChatResponse,
    CompareRequest,
    CompareResponse,
    RetrievedContext,
)
from services import embeddings, llm, rag_pipeline
from settings import Settings, get_settings

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, settings: Settings = Depends(get_settings)) -> ChatResponse:
    """Return either a baseline or RAG response depending on ``use_rag``."""

    if not request.use_rag:
        logger.info("Processing baseline chat request")
        message = await run_in_threadpool(llm.generate_baseline, request.message)
        return ChatResponse(message=message, mode="baseline", retrieved_context=[], avg_similarity=0.0)

    logger.info("Processing RAG chat request")
    top_k = request.top_k or settings.default_top_k
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

    return ChatResponse(
        message=message,
        mode="rag",
        retrieved_context=retrieved_context,
        avg_similarity=avg_score,
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
