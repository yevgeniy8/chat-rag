"""services/utils.py
=====================
Utility helpers shared across the backend. Teaching note: collecting small,
reusable helpers keeps business logic focused on the core problem.
"""

from __future__ import annotations

import functools
import time
import unicodedata
import uuid
from pathlib import Path
from typing import Any, Callable, Iterable

from loguru import logger


def generate_file_id(original_name: str) -> str:
    """Create a stable, unique file identifier for uploads.

    We combine a UUID4 with the sanitized original filename so developers can
    trace the source of a chunk while guaranteeing uniqueness.
    """

    safe_name = "-".join(original_name.split())
    return f"{uuid.uuid4()}__{safe_name}"


def normalize_text(text: str) -> str:
    """Normalize unicode text for consistent downstream processing."""

    return unicodedata.normalize("NFKC", text).strip()


def safe_join(base: Path, *paths: Iterable[str | Path]) -> Path:
    """Safely join paths while preventing directory traversal attacks."""

    resolved_base = base.resolve()
    candidate = resolved_base.joinpath(*paths).resolve()
    if not str(candidate).startswith(str(resolved_base)):
        raise ValueError("Attempted path traversal outside of base directory.")
    return candidate


def log_time(action: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Decorator that logs how long a function takes to execute."""

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            start = time.perf_counter()
            result = func(*args, **kwargs)
            duration = time.perf_counter() - start
            logger.info("%s completed in %.3f seconds", action, duration)
            return result

        return wrapper

    return decorator
