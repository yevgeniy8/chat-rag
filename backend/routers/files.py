"""routers/files.py
====================
Routes that expose uploaded document metadata and lifecycle operations. The
frontend relies on these endpoints to keep its file manager in sync with the
vector store."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from schemas.files import FileInfo, FileRemovalResponse
from services.utils import safe_join
from services.vector_store import get_vector_store
from settings import Settings, get_settings

router = APIRouter(prefix="/files", tags=["files"])


def _ensure_directory(settings: Settings) -> Path:
    directory = settings.files_dir
    directory.mkdir(parents=True, exist_ok=True)
    return directory


@router.get("", response_model=List[FileInfo])
async def list_files(settings: Settings = Depends(get_settings)) -> List[FileInfo]:
    """Return metadata for each uploaded file."""

    directory = _ensure_directory(settings)
    files: List[FileInfo] = []
    for path in directory.iterdir():
        if not path.is_file():
            continue
        stats = path.stat()
        uploaded_at = datetime.fromtimestamp(stats.st_mtime, tz=timezone.utc)
        files.append(
            FileInfo(
                name=path.name,
                size=stats.st_size,
                uploaded_at=uploaded_at,
            )
        )
    files.sort(key=lambda item: item.uploaded_at, reverse=True)
    return files


@router.get("/{filename}", response_class=FileResponse)
async def get_file(filename: str, settings: Settings = Depends(get_settings)) -> FileResponse:
    """Stream a previously uploaded file for previewing or download."""

    directory = _ensure_directory(settings)
    try:
        path = safe_join(directory, filename)
    except ValueError as exc:  # pragma: no cover - defensive guard
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path)


@router.delete("/{filename}", response_model=FileRemovalResponse)
async def delete_file(filename: str, settings: Settings = Depends(get_settings)) -> FileRemovalResponse:
    """Remove a file from disk and purge associated vectors."""

    directory = _ensure_directory(settings)
    try:
        path = safe_join(directory, filename)
    except ValueError as exc:  # pragma: no cover - defensive guard
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    path.unlink()
    store = get_vector_store()
    removed_vectors = store.remove_by_file(filename)

    return FileRemovalResponse(deleted=True, vectors_removed=removed_vectors)

