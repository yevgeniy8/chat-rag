"""routers/chat.py
==================
Contains the chat endpoint that compares baseline LLM responses with
retrieval-augmented answers.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool
from loguru import logger

from schemas.chat import ChatRequest, ChatResponse, RetrievedContext
from services import llm, rag_pipeline
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
