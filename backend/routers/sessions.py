"""API routes for managing chat comparison sessions."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from schemas.chat import ChatSession
from services.session_store import get_session_store

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("", response_model=list[ChatSession])
async def list_sessions() -> list[ChatSession]:
    """Return all sessions sorted by most recent activity."""

    store = get_session_store()
    return store.list_sessions()


@router.get("/{session_id}", response_model=ChatSession)
async def get_session(session_id: str) -> ChatSession:
    store = get_session_store()
    session = store.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/{session_id}")
async def delete_session(session_id: str) -> dict[str, bool]:
    store = get_session_store()
    removed = store.delete_session(session_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True}


@router.delete("")
async def delete_all_sessions() -> dict[str, bool]:
    store = get_session_store()
    store.clear()
    return {"deleted": True}
