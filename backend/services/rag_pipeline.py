"""Retrieval augmented generation pipeline with per-user isolation."""

from __future__ import annotations

import re
import unicodedata
from typing import Iterable, List

import numpy as np
from sqlalchemy.orm import Session

from models import Chunk
from services import embeddings
from services.faiss_store import add_vectors, search


def clean_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def chunk_text(text: str, max_tokens: int = 400, overlap: int = 50) -> List[str]:
    tokens = text.split()
    chunks: List[str] = []
    start = 0
    while start < len(tokens):
        end = min(start + max_tokens, len(tokens))
        chunk_tokens = tokens[start:end]
        chunks.append(" ".join(chunk_tokens))
        if end == len(tokens):
            break
        start = max(0, end - overlap)
    return chunks


def normalize_vectors(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return vectors / norms


def index_chunks(user_id: int, file_id: int, texts: Iterable[str]) -> List[Chunk]:
    vectors = embeddings.embed_texts(texts)
    normalized_vectors = normalize_vectors(vectors.astype("float32"))
    metadata = []
    new_chunks: List[Chunk] = []
    for idx, (text, vector) in enumerate(zip(texts, normalized_vectors)):
        metadata.append({"chunk_text": text, "file_id": file_id, "chunk_index": idx})
        new_chunks.append(
            Chunk(
                user_id=user_id,
                file_id=file_id,
                text=text,
                vector=vector.tobytes(),
                chunk_index=idx,
            )
        )
    add_vectors(user_id, normalized_vectors, metadata)
    return new_chunks


def retrieve_context(user_id: int, query: str, k: int = 5, db: Session | None = None) -> List[dict]:
    query_vec = embeddings.embed_query(query)
    results = search(user_id, query_vec, k)
    enriched: List[dict] = []
    for record in results:
        file_id = record.get("file_id")
        chunk_index = record.get("chunk_index")
        if db is not None and file_id is not None and chunk_index is not None:
            chunk = (
                db.query(Chunk)
                .filter(
                    Chunk.user_id == user_id,
                    Chunk.file_id == file_id,
                    Chunk.chunk_index == chunk_index,
                )
                .first()
            )
            if chunk:
                record["chunk_text"] = chunk.text
        enriched.append(record)
    return enriched


def build_context(chunks: Iterable[dict]) -> str:
    lines: List[str] = []
    for chunk in chunks:
        snippet = chunk.get("chunk_text", "")
        file_id = chunk.get("file_id", "?")
        chunk_index = chunk.get("chunk_index", "?")
        lines.append(f"[file {file_id} chunk {chunk_index}] {snippet}")
    return "\n".join(lines)
