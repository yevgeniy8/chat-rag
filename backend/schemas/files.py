"""schemas/files.py
====================
Pydantic models describing the file management API."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class FileInfo(BaseModel):
    file_id: str
    filename: str
    file_type: str
    uploaded_at: datetime
    preview_url: str


class FileRemovalResponse(BaseModel):
    deleted: bool
    vectors_removed: int


class FilePreviewResponse(BaseModel):
    content: str

