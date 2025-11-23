"""services/rag_pipeline.py
==========================
Coordinates the retrieval-augmented generation workflow: embedding the query,
searching the vector store, and formatting context for the LLM prompt.
"""

from __future__ import annotations

from typing import Dict, Iterable, List, Tuple

import numpy as np

from .embeddings import embed_query, embed_texts
from .vector_store import get_vector_store


def retrieve(query: str, top_k: int) -> Tuple[List[Dict[str, object]], np.ndarray]:
    """Return the most similar chunks and the cached query embedding."""

    query_vector = embed_query(query)
    store = get_vector_store()
    hits = store.search(query_vector, top_k)
    hits.sort(key=lambda item: float(item.get("score", 0.0)), reverse=True)
    return hits, query_vector


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
    """Compute the arithmetic mean of cosine similarity scores provided by the index."""

    scores = [chunk.get("score", 0.0) for chunk in chunks]
    if not scores:
        return 0.0
    return float(np.mean(scores))


def average_query_chunk_similarity(query_vector: np.ndarray, chunks: List[Dict[str, object]]) -> float:
    """Compute cosine similarity between the query embedding and each chunk embedding."""

    if not chunks:
        return 0.0

    texts = [chunk.get("text", "") for chunk in chunks]
    if not any(texts):
        return 0.0

    chunk_vectors = embed_texts(texts)
    query_norm = _normalize_vector(query_vector)
    similarities = []
    for vector in chunk_vectors:
        chunk_norm = _normalize_vector(vector)
        similarities.append(float(np.dot(query_norm, chunk_norm)))

    if not similarities:
        return 0.0
    return float(np.mean(similarities))


def answer_semantic_similarity(answer: str, top_chunk: Dict[str, object] | None) -> float:
    """Compute cosine similarity between a generated answer and the best chunk."""

    if not answer or not top_chunk:
        return 0.0
    top_text = top_chunk.get("text", "")
    if not top_text:
        return 0.0

    answer_vec, chunk_vec = embed_texts([answer, top_text])
    answer_norm = _normalize_vector(answer_vec)
    chunk_norm = _normalize_vector(chunk_vec)
    return float(np.dot(answer_norm, chunk_norm))


def _normalize_vector(vector: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(vector))
    if norm == 0:
        return vector
    return vector / norm
