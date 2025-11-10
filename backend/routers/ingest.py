"""routers/ingest.py
====================
Endpoints responsible for ingesting user-provided documents into the RAG
pipeline. The upload endpoint stores raw files, while the ingest endpoint
processes them into vector embeddings.
"""

from __future__ import annotations

from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from loguru import logger

from schemas.ingest import FileUploadResponse, IngestRequest, IngestResponse
from services import embeddings, loader, splitter
from services.utils import generate_file_id, safe_join
from services.vector_store import get_vector_store
from settings import Settings, get_settings

router = APIRouter(tags=["ingest"])


def _get_files_dir(settings: Settings) -> Path:
    directory = settings.files_dir
    directory.mkdir(parents=True, exist_ok=True)
    return directory


@router.post("/files/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...), settings: Settings = Depends(get_settings)
) -> FileUploadResponse:
    """Persist the uploaded file and return a generated identifier."""

    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")

    files_dir = _get_files_dir(settings)
    file_id = generate_file_id(file.filename)
    destination = safe_join(files_dir, file_id)

    logger.info("Saving upload %s to %s", file.filename, destination)
    content = await file.read()
    destination.write_bytes(content)

    return FileUploadResponse(file_id=file_id)


def _ingest_file(file_path: Path, settings: Settings) -> int:
    """Synchronous ingestion logic executed in a thread pool."""

    document = loader.load_document(file_path)
    chunks = splitter.split_text(
        document.text,
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        base_metadata={"file": document.metadata.get("file", file_path.name)},
        page_texts=document.page_texts,
    )
    if not chunks:
        return 0
    texts: List[str] = [chunk.text for chunk in chunks]
    vectors = embeddings.embed_texts(texts)
    store = get_vector_store()
    metadatas = []
    for chunk in chunks:
        record = {"text": chunk.text}
        record.update(chunk.metadata)
        metadatas.append(record)
    store.add(vectors, metadatas)
    return len(chunks)


@router.post("/ingest", response_model=IngestResponse)
async def ingest_file(
    payload: IngestRequest, settings: Settings = Depends(get_settings)
) -> IngestResponse:
    """Convert a previously uploaded file into vector embeddings."""

    files_dir = _get_files_dir(settings)
    file_path = safe_join(files_dir, payload.file_id)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    chunks_ingested = await run_in_threadpool(_ingest_file, file_path, settings)
    return IngestResponse(chunks=chunks_ingested)
