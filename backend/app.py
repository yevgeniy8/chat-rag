"""FastAPI application entrypoint for "LLM Chat with RAG vs No-RAG".

Run instructions::
    cd backend
    python -m venv .venv
    # Linux/Mac
    source .venv/bin/activate
    # Windows
    # .venv\\Scripts\\activate

    pip install -r requirements.txt
    cp .env.example .env  # populate secrets
    uvicorn app:app --reload --port 8000

This file wires routers, logging, and startup tasks so the backend is
production ready and easy to reason about for thesis documentation.
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from routers import chat, files, health, ingest
from services.vector_store import get_vector_store
from settings import settings

os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

app = FastAPI(title="LLM Chat with RAG vs No-RAG", version="1.0.0")

# Teaching note: CORS is opened wide for local development convenience. In
# production you would restrict this to trusted frontend origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure loguru to write structured logs to disk for later analysis.
log_path = Path("backend/logs/app.log")
log_path.parent.mkdir(parents=True, exist_ok=True)
logger.add(log_path, rotation="500 MB", retention="14 days")


@app.on_event("startup")
async def startup_event() -> None:
    """Prepare resources like directories and the vector store."""

    logger.info("Starting LLM Chat backend")
    settings.files_dir.mkdir(parents=True, exist_ok=True)
    settings.faiss_index_path.parent.mkdir(parents=True, exist_ok=True)

    # Lazy-loading strategy: we access the vector store once so it loads if
    # present, and we schedule the embedding model to load on first usage.
    get_vector_store()
    logger.info("Vector store ready (model loads on demand)")


@app.get("/")
async def root() -> dict[str, str]:
    """Simple welcome route to aid manual testing."""

    return {"message": "LLM Chat with RAG vs No-RAG backend is running"}


app.include_router(health.router)
app.include_router(ingest.router)
app.include_router(files.router)
app.include_router(chat.router)
