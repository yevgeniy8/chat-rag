"""evaluation/evaluation_store.py
===============================
Utilities for persisting evaluation runs to a JSONL file so they can be
reviewed later via the history endpoint.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
from uuid import uuid4

RESULTS_PATH = Path("backend/evaluation/results.jsonl")
RESULTS_PATH.parent.mkdir(parents=True, exist_ok=True)


EvaluationRecord = Dict[str, object]


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def save_result(payload: Dict[str, object]) -> EvaluationRecord:
    """Persist a single evaluation record to the JSONL log."""

    record: EvaluationRecord = {
        "id": str(uuid4()),
        "created_at": _timestamp(),
        **payload,
    }

    with RESULTS_PATH.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")

    return record


def list_results() -> List[EvaluationRecord]:
    if not RESULTS_PATH.exists():
        return []
    records: List[EvaluationRecord] = []
    with RESULTS_PATH.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    records.sort(key=lambda rec: rec.get("created_at", ""), reverse=True)
    return records


def get_result(record_id: str) -> Optional[EvaluationRecord]:
    return next((record for record in list_results() if record.get("id") == record_id), None)
