"""services/vector_store.py
===========================
Abstraction around FAISS for storing and retrieving embeddings. Keeping this
logic isolated lets us swap vector stores in the future without touching the
rest of the pipeline.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List

import faiss
import numpy as np
from loguru import logger

from settings import settings


@dataclass
class VectorStore:
    """Lightweight wrapper over a FAISS index and parallel metadata."""

    index_path: Path
    metadata_path: Path
    index: faiss.Index | None = None
    metadata: List[Dict[str, object]] = field(default_factory=list)

    def load(self) -> None:
        """Load index and metadata from disk if present."""

        if self.index_path.exists():
            self.index = faiss.read_index(str(self.index_path))
            logger.info("Loaded FAISS index with %d vectors", self.index.ntotal)
        if self.metadata_path.exists():
            with self.metadata_path.open("r", encoding="utf-8") as fh:
                self.metadata = [json.loads(line) for line in fh if line.strip()]
            logger.info("Loaded %d metadata records", len(self.metadata))

    def _ensure_index(self, dimension: int) -> faiss.Index:
        if self.index is None:
            logger.info("Creating new FAISS index of dimension %d", dimension)
            self.index = faiss.IndexFlatIP(dimension)
        return self.index

    def add(self, vectors: np.ndarray, metadatas: Iterable[Dict[str, object]]) -> None:
        if vectors.size == 0:
            return
        vectors = self._normalize(vectors)
        index = self._ensure_index(vectors.shape[1])
        index.add(vectors)
        for meta in metadatas:
            self.metadata.append(meta)
        self._persist()

    def remove_by_file(self, file_name: str) -> int:
        """Remove all vectors originating from a specific file."""

        if not self.metadata:
            return 0

        remaining: List[Dict[str, object]] = [
            dict(record) for record in self.metadata if record.get("file") != file_name
        ]
        removed = len(self.metadata) - len(remaining)
        if removed == 0:
            return 0

        self._rebuild(remaining)
        return removed

    def search(self, query_vector: np.ndarray, top_k: int) -> List[Dict[str, object]]:
        if self.index is None or self.index.ntotal == 0:
            return []
        query_vector = self._normalize(query_vector.reshape(1, -1))
        scores, indices = self.index.search(query_vector, top_k)
        hits: List[Dict[str, object]] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1 or idx >= len(self.metadata):
                continue
            record = dict(self.metadata[idx])
            hits.append({"text": record.pop("text", ""), "score": float(score), "meta": record})
        return hits

    def _persist(self) -> None:
        if self.index is None:
            return
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        self.metadata_path.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(self.index_path))
        with self.metadata_path.open("w", encoding="utf-8") as fh:
            for record in self.metadata:
                fh.write(json.dumps(record, ensure_ascii=False) + "\n")

    def _rebuild(self, records: List[Dict[str, object]]) -> None:
        """Recreate the FAISS index from the provided metadata records."""

        if not records:
            self._clear()
            return

        texts = [record.get("text", "") for record in records]
        if not any(texts):
            self._clear()
            return

        from services import embeddings

        vectors = embeddings.embed_texts(texts)
        if vectors.size == 0:
            self._clear()
            return

        self.index = None
        self.metadata = []
        index = self._ensure_index(vectors.shape[1])
        index.add(self._normalize(vectors))
        self.metadata.extend(records)
        self._persist()

    def _clear(self) -> None:
        """Reset in-memory and on-disk state for the store."""

        self.index = None
        self.metadata = []
        if self.index_path.exists():
            self.index_path.unlink()
        if self.metadata_path.exists():
            self.metadata_path.unlink()

    @staticmethod
    def _normalize(vectors: np.ndarray) -> np.ndarray:
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return vectors / norms


_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore(settings.faiss_index_path, settings.metadata_path)
        _store.load()
    return _store
