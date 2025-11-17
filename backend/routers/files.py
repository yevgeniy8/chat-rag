"""routers/files.py
====================
Routes that expose uploaded document metadata and lifecycle operations. The
frontend relies on these endpoints to keep its file manager in sync with the
vector store."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, HTMLResponse

from schemas.files import FileInfo, FilePreviewResponse, FileRemovalResponse
from services import loader
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


@router.get("/raw/{filename}", response_class=FileResponse)
async def get_raw_file(filename: str, settings: Settings = Depends(get_settings)) -> FileResponse:
    """Stream a previously uploaded file for previewing or download."""

    path = _resolve_path(filename, settings)
    return FileResponse(path)


@router.get("/{filename}", response_class=FileResponse)
async def get_file(filename: str, settings: Settings = Depends(get_settings)) -> FileResponse:
    """Backward-compatible raw file endpoint."""

    return await get_raw_file(filename, settings)


@router.get("/preview/{filename}", response_model=FilePreviewResponse)
async def preview_file(
    filename: str,
    as_format: str | None = Query(default=None, alias="as"),
    settings: Settings = Depends(get_settings),
):
    """Return lightweight preview data for supported file formats."""

    path = _resolve_path(filename, settings)
    try:
        preview = loader.generate_preview(path)
    except ValueError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if as_format == "html" and preview.kind in {"html", "text"} and preview.html:
        return HTMLResponse(preview.html, media_type="text/html")

    preview_url = f"/files/raw/{filename}" if preview.kind == "pdf" else None
    return FilePreviewResponse(
        kind=preview.kind,
        file_name=filename,
        preview_url=preview_url,
        html=preview.html,
    )


@router.delete("/{filename}", response_model=FileRemovalResponse)
async def delete_file(filename: str, settings: Settings = Depends(get_settings)) -> FileRemovalResponse:
    """Remove a file from disk and purge associated vectors."""

    path = _resolve_path(filename, settings)
    path.unlink()
    store = get_vector_store()
    removed_vectors = store.remove_by_file(filename)

    return FileRemovalResponse(deleted=True, vectors_removed=removed_vectors)


def _resolve_path(filename: str, settings: Settings) -> Path:
    directory = _ensure_directory(settings)
    try:
        path = safe_join(directory, filename)
    except ValueError as exc:  # pragma: no cover - defensive guard
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return path

