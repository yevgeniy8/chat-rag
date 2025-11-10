"""services/llm.py
=================
Wraps interaction with OpenAI's Chat Completions API. Teaching note: by hiding
API specifics behind helper functions we make it easy to swap providers or add
retry logic later.
"""

from __future__ import annotations

from typing import Optional

from loguru import logger
from openai import OpenAI

from settings import settings

_client: Optional[OpenAI] = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY must be set to use LLM endpoints")
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


def generate_baseline(user_query: str) -> str:
    """Generate a response without any retrieved context."""

    logger.info("Generating baseline response")
    client = _get_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a careful teaching assistant. Answer user questions "
                    "truthfully based on your general knowledge. If unsure, say so."
                ),
            },
            {"role": "user", "content": user_query},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content or ""


def generate_with_context(user_query: str, context: str) -> str:
    """Generate a response that must rely on supplied context snippets."""

    logger.info("Generating RAG response with %d context characters", len(context))
    client = _get_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a retrieval-augmented assistant. Use ONLY the provided "
                    "context to answer. If the context lacks the answer, state that "
                    "clearly and do not fabricate details."
                ),
            },
            {
                "role": "system",
                "content": f"Context:\n{context}",
            },
            {"role": "user", "content": user_query},
        ],
        temperature=0.1,
    )
    return response.choices[0].message.content or ""
