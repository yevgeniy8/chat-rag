"""Lightweight persistence layer for chat comparison sessions.

Sessions are stored as JSON on disk to keep the implementation simple while
still surviving backend restarts. The store exposes convenience helpers for
listing, retrieving, and mutating sessions without leaking persistence details
into the routers.
"""

from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from loguru import logger

from schemas.chat import ChatEvalMetrics, ChatMessageRecord, ChatModeResponse, ChatSession


class SessionStore:
    """Persist chat sessions in a JSON file."""

    def __init__(self, storage_path: Path) -> None:
        self._storage_path = storage_path
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()

    # ------------------------------------------------------------------
    # File helpers
    # ------------------------------------------------------------------
    def _load_raw(self) -> List[dict]:
        if not self._storage_path.exists():
            return []
        try:
            with self._storage_path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
                if isinstance(data, list):
                    return data
        except json.JSONDecodeError:
            logger.warning("Session storage file is corrupt; resetting store")
        return []

    def _load_sessions(self) -> List[ChatSession]:
        raw_sessions = self._load_raw()
        sessions: List[ChatSession] = []
        for payload in raw_sessions:
            try:
                sessions.append(ChatSession.model_validate(payload))
            except Exception as exc:  # pragma: no cover - defensive
                logger.error("Failed to parse session payload: {}", exc)
        return sessions

    def _persist(self, sessions: List[ChatSession]) -> None:
        serialized = [session.model_dump(mode="json") for session in sessions]
        with self._storage_path.open("w", encoding="utf-8") as handle:
            json.dump(serialized, handle, indent=2)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def add_message(
        self,
        *,
        session_id: Optional[str],
        prompt: str,
        timestamp: datetime,
        baseline: ChatModeResponse,
        rag: ChatModeResponse,
    ) -> ChatSession:
        """Append a conversational turn and return the updated session."""

        with self._lock:
            sessions = self._load_sessions()
            target_id = session_id
            session: Optional[ChatSession] = None
            if target_id:
                session = next((item for item in sessions if item.session_id == target_id), None)

            if session is None:
                target_id = str(uuid4())
                metrics = ChatEvalMetrics(
                    baseline_latency=baseline.latency,
                    rag_latency=rag.latency,
                    semantic_similarity=rag.semantic_similarity or 0.0,
                    created_at=timestamp,
                    updated_at=timestamp,
                )
                session = ChatSession(
                    session_id=target_id,
                    created_at=timestamp,
                    updated_at=timestamp,
                    messages=[],
                    metrics=metrics,
                )
                sessions.append(session)

            message_record = ChatMessageRecord(
                prompt=prompt,
                timestamp=timestamp,
                baseline=baseline,
                rag=rag,
            )
            session.messages.append(message_record)
            session.updated_at = timestamp
            session.metrics.baseline_latency = baseline.latency
            session.metrics.rag_latency = rag.latency
            session.metrics.semantic_similarity = rag.semantic_similarity or 0.0
            session.metrics.updated_at = timestamp

            # ensure deterministic ordering when persisted
            sessions.sort(key=lambda item: item.updated_at, reverse=True)
            self._persist(sessions)
            return session

    def list_sessions(self) -> List[ChatSession]:
        sessions = self._load_sessions()
        sessions.sort(key=lambda item: item.updated_at, reverse=True)
        return sessions

    def get_session(self, session_id: str) -> Optional[ChatSession]:
        sessions = self._load_sessions()
        return next((item for item in sessions if item.session_id == session_id), None)

    def delete_session(self, session_id: str) -> bool:
        with self._lock:
            sessions = self._load_sessions()
            filtered = [item for item in sessions if item.session_id != session_id]
            if len(filtered) == len(sessions):
                return False
            self._persist(filtered)
        return True

    def clear(self) -> None:
        with self._lock:
            self._persist([])


_store: Optional[SessionStore] = None


def get_session_store() -> SessionStore:
    global _store
    if _store is None:
        base_dir = Path(__file__).resolve().parent.parent
        storage_path = base_dir / "backend_data" / "sessions.json"
        _store = SessionStore(storage_path)
    return _store
