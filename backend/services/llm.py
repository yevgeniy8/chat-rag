"""services/llm.py
=================
Provider-agnostic helpers for generating answers with or without retrieval
context. The heavy lifting of dispatching to specific vendors is delegated to
``llm_provider`` so the rest of the codebase can stay unaware of HTTP details.
"""

from __future__ import annotations

from loguru import logger

from services.llm_provider import generate_answer

DEFAULT_MODEL = "gpt-4o-mini"
DEFAULT_PROVIDER = "openai"


async def generate_baseline(user_query: str, model: str = DEFAULT_MODEL, provider: str | None = None) -> str:
    """Generate a response without any retrieved context."""

    logger.info("Generating baseline response")
    prompt = (
        "You are a careful teaching assistant. Answer user questions truthfully "
        "based on your general knowledge. If unsure, say so.\n\n"
        f"User question: {user_query}"
    )
    return await generate_answer(provider or DEFAULT_PROVIDER, model, prompt, temperature=0.2)


async def generate_with_context(
    user_query: str, context: str, model: str = DEFAULT_MODEL, provider: str | None = None
) -> str:
    """Generate a response that must rely on supplied context snippets."""

    logger.info("Generating RAG response with %d context characters", len(context))
    prompt = (
        "You are a retrieval-augmented assistant. Use ONLY the provided context "
        "to answer. If the context lacks the answer, state that clearly and do not fabricate details.\n\n"
        f"Context:\n{context}\n\nUser question: {user_query}"
    )
    return await generate_answer(provider or DEFAULT_PROVIDER, model, prompt, temperature=0.1)
