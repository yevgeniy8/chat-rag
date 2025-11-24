"""FAISS utilities providing per-user indexes with metadata persistence."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import faiss
import numpy as np

from settings import settings


def _user_dir(user_id: int) -> Path:
    path = settings.faiss_dir / f"user_{user_id}"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _index_paths(user_id: int) -> Tuple[Path, Path]:
    base = _user_dir(user_id)
    return base / "index.faiss", base / "metadata.json"


def _normalize(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return vectors / norms


def load_index(user_id: int, dimension: int | None = None) -> faiss.Index:
    index_path, _ = _index_paths(user_id)
    if index_path.exists():
        return faiss.read_index(str(index_path))
    if dimension is None:
        raise RuntimeError("Cannot create index without embedding dimension")
    index = faiss.IndexFlatIP(dimension)
    faiss.write_index(index, str(index_path))
    return index


def load_metadata(user_id: int) -> List[Dict]:
    _, metadata_path = _index_paths(user_id)
    if not metadata_path.exists():
        return []
    with metadata_path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def save_metadata(user_id: int, metadata: List[Dict]) -> None:
    _, metadata_path = _index_paths(user_id)
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    with metadata_path.open("w", encoding="utf-8") as fh:
        json.dump(metadata, fh, ensure_ascii=False, indent=2)


def add_vectors(user_id: int, vectors: np.ndarray, metadatas: Iterable[Dict]) -> None:
    if vectors.size == 0:
        return
    normalized = _normalize(vectors.astype("float32"))
    index = load_index(user_id, dimension=normalized.shape[1])
    index.add(normalized)
    faiss.write_index(index, str(_index_paths(user_id)[0]))

    existing = load_metadata(user_id)
    existing.extend(list(metadatas))
    save_metadata(user_id, existing)


def search(user_id: int, query_vector: np.ndarray, k: int) -> List[Dict]:
    index_path, _ = _index_paths(user_id)
    if not index_path.exists():
        return []
    index = faiss.read_index(str(index_path))
    if index.ntotal == 0:
        return []
    query = _normalize(query_vector.reshape(1, -1).astype("float32"))
    scores, indices = index.search(query, k)
    metadata = load_metadata(user_id)
    results: List[Dict] = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1 or idx >= len(metadata):
            continue
        record = dict(metadata[int(idx)])
        record["score"] = float(score)
        results.append(record)
    results.sort(key=lambda x: x.get("score", 0.0), reverse=True)
    return results
