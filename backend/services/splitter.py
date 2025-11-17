"""services/splitter.py
=======================
Provides a simple yet effective text splitting strategy. We break long
documents into overlapping chunks so embeddings capture context around
sentence boundaries, which improves retrieval quality.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List


@dataclass
class Chunk:
    """Represents a slice of the document and its metadata."""

    text: str
    metadata: Dict[str, str | int | float]


def split_text(
    text: str,
    *,
    chunk_size: int,
    chunk_overlap: int,
    base_metadata: Dict[str, str],
    page_texts: Iterable[str] | None = None,
) -> List[Chunk]:
    """Split text into overlapping chunks.

    Overlap is important because embeddings operate on fixed windows; without
    overlap we risk cutting a sentence midstream and losing context. Here we
    use a sliding window that advances ``chunk_size - chunk_overlap`` tokens.
    """

    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be >=0 and < chunk_size")

    chunks: List[Chunk] = []
    start = 0
    text_length = len(text)
    step = chunk_size - chunk_overlap
    chunk_index = 0

    while start < text_length:
        end = min(start + chunk_size, text_length)
        chunk_text = text[start:end]
        metadata = dict(base_metadata)
        metadata.update({"chunk_id": chunk_index, "start": start, "end": end})
        chunks.append(Chunk(text=chunk_text, metadata=metadata))
        start += step
        chunk_index += 1

    # Attach page hints when available to aid the UI in surfacing context.
    if page_texts:
        for chunk in chunks:
            chunk.metadata.setdefault("page", _infer_page(chunk, page_texts))

    return chunks


def _infer_page(chunk: Chunk, page_texts: Iterable[str]) -> int:
    """Best-effort heuristic: map chunk offsets to page numbers."""

    pages = list(page_texts)
    cumulative = 0
    for idx, page_text in enumerate(pages):
        cumulative += len(page_text)
        if chunk.metadata.get("start", 0) < cumulative:
            return idx + 1
    return len(pages)
