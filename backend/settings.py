"""settings.py
=================
This module centralizes configuration loading for the FastAPI backend.
We rely on Pydantic's ``BaseSettings`` to read environment variables and
provide convenient defaults. By keeping configuration logic isolated, we
make the rest of the codebase cleaner and easier to test.
"""

from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Typed container for all application settings.

    Using ``BaseSettings`` allows values to be loaded from environment
    variables, ``.env`` files, or even overridden during tests. Teaching
    note: central settings like this avoid scattering constants across the
    project, which reduces bugs when configuration changes.
    """

    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    embedding_model: str = Field(
        default="sentence-transformers/all-mpnet-base-v2", env="EMBEDDING_MODEL"
    )
    faiss_index_path: Path = Field(
        default=Path("backend/data/vectors/index.faiss"), env="FAISS_INDEX_PATH"
    )
    metadata_path: Path = Field(
        default=Path("backend/data/vectors/meta.jsonl"), env="METADATA_PATH"
    )
    files_dir: Path = Field(default=Path("backend/data/files"), env="FILES_DIR")
    chunk_size: int = Field(default=400, env="CHUNK_SIZE")
    chunk_overlap: int = Field(default=120, env="CHUNK_OVERLAP")
    default_top_k: int = Field(default=8, env="TOP_K")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached ``Settings`` instance.

    The ``lru_cache`` decorator ensures we only parse environment variables
    once per process. This pattern mimics a lightweight singleton and avoids
    repeated disk reads, which matters when the app scales to many requests.
    """

    return Settings()


settings = get_settings()
"""Module-level accessor so other modules can simply ``from settings import settings``."""
