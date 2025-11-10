"""routers/health.py
====================
Exposes a simple health check for uptime monitoring.
"""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", summary="Health check")
async def healthcheck() -> dict[str, str]:
    """Return a minimal status payload."""

    return {"status": "ok"}
