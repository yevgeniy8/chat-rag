"""services/embeddings.py
=========================
Handles embedding generation using SentenceTransformers. Centralizing model
loading ensures we only keep a single copy of the model in memory, which is
important for production deployments.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Iterable

import numpy as np
from loguru import logger
from sentence_transformers import SentenceTransformer

from settings import settings


@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    """Load the sentence-transformer model once and cache it."""

    logger.info("Loading SentenceTransformer model: %s", settings.embedding_model)
    return SentenceTransformer(settings.embedding_model)


def embed_texts(texts: Iterable[str]) -> np.ndarray:
    """Embed a sequence of texts into a numpy array."""

    model = _get_model()
    embeddings = model.encode(list(texts), batch_size=16, show_progress_bar=False)
    return np.array(embeddings, dtype="float32")


def embed_query(text: str) -> np.ndarray:
    """Convenience wrapper for embedding a single query string."""

    return embed_texts([text])[0]
