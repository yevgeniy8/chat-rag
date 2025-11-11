"""services/metrics.py
=======================
Utility helpers for evaluating the delta between baseline and RAG outputs.

The functions in this module are intentionally lightweight wrappers around
widely used NLP metrics so they can be reused across endpoints and tests
without duplicating boilerplate in the routers.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Dict

import numpy as np
from nltk.translate.bleu_score import SmoothingFunction, sentence_bleu
from rouge_score import rouge_scorer

from services.embeddings import embed_texts


def _normalize_vector(vector: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(vector))
    if norm == 0:
        return vector
    return vector / norm


def cosine_similarity(baseline: str, rag: str) -> float:
    """Return cosine similarity between two generated answers."""

    if not baseline or not rag:
        return 0.0

    vectors = embed_texts([baseline, rag])
    if vectors.size == 0:
        return 0.0

    baseline_vec, rag_vec = (_normalize_vector(vec) for vec in vectors)
    similarity = float(np.dot(baseline_vec, rag_vec))
    return float(max(min(similarity, 1.0), -1.0))


def bleu_score(reference: str, candidate: str) -> float:
    """Compute a smoothed BLEU score treating ``reference`` as ground truth."""

    reference_tokens = reference.split()
    candidate_tokens = candidate.split()
    if not reference_tokens or not candidate_tokens:
        return 0.0

    smoothing = SmoothingFunction().method1
    score = sentence_bleu([reference_tokens], candidate_tokens, smoothing_function=smoothing)
    return float(score)


@lru_cache(maxsize=1)
def _get_rouge_scorer() -> rouge_scorer.RougeScorer:
    return rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)


def rouge_l(reference: str, candidate: str) -> float:
    """Return the ROUGE-L F1 score between reference and candidate text."""

    if not reference or not candidate:
        return 0.0

    scorer = _get_rouge_scorer()
    score = scorer.score(reference, candidate)["rougeL"].fmeasure
    return float(score)


def count_tokens(text: str) -> int:
    """Estimate token usage via whitespace tokenisation."""

    if not text:
        return 0
    return len(text.split())


def summarize_metrics(baseline: str, rag: str) -> Dict[str, float]:
    """Convenience helper that returns the core comparison metrics."""

    return {
        "cosine_similarity": cosine_similarity(baseline, rag),
        "bleu": bleu_score(baseline, rag),
        "rouge": rouge_l(baseline, rag),
    }

