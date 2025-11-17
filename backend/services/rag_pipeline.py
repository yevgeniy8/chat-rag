"""services/rag_pipeline.py
==========================
Coordinates the retrieval-augmented generation workflow: embedding the query,
searching the vector store, and formatting context for the LLM prompt.
"""

from __future__ import annotations

from typing import Dict, Iterable, List

import numpy as np

from .embeddings import embed_query
from .vector_store import get_vector_store


def retrieve(query: str, top_k: int) -> List[Dict[str, object]]:
    """Return the most similar chunks for a user query."""

    query_vector = embed_query(query)
    store = get_vector_store()
    hits = store.search(query_vector, top_k)
    hits.sort(key=lambda item: float(item.get("score", 0.0)), reverse=True)
    return hits


def build_context(chunks: Iterable[Dict[str, object]]) -> str:
    """Format retrieved chunks into a compact context string for the LLM."""

    lines: List[str] = []
    for idx, chunk in enumerate(chunks, start=1):
        meta = chunk.get("meta", {})
        file_name = meta.get("file", "unknown")
        page = meta.get("page", "?")
        snippet = chunk.get("text", "").replace("\n", " ").strip()
        lines.append(f"[{idx}] (file: {file_name}, page: {page}) {snippet}")
    return "\n".join(lines)


def average_similarity(chunks: Iterable[Dict[str, object]]) -> float:
    """Compute the arithmetic mean of cosine similarity scores."""

    scores = [chunk.get("score", 0.0) for chunk in chunks]
    if not scores:
        return 0.0
    return float(np.mean(scores))
