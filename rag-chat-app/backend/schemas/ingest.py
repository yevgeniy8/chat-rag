"""schemas/ingest.py
====================
Defines Pydantic models for file ingestion endpoints. Separating schemas keeps
API contracts explicit and encourages reuse between routers and tests.
"""

from __future__ import annotations

from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    """Response returned after a successful file upload."""

    file_id: str


class IngestRequest(BaseModel):
    """Payload instructing the server to index a specific file."""

    file_id: str


class IngestResponse(BaseModel):
    """Summary of the ingestion process."""

    chunks: int
