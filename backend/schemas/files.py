"""schemas/files.py
====================
Pydantic models describing the file management API."""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class FileInfo(BaseModel):
    name: str
    size: int
    uploaded_at: datetime


class FileRemovalResponse(BaseModel):
    deleted: bool
    vectors_removed: int


class FilePreviewResponse(BaseModel):
    kind: Literal["html", "pdf", "text"]
    file_name: str
    preview_url: Optional[str] = None
    html: Optional[str] = None

