from __future__ import annotations

from fastapi import APIRouter, HTTPException

from evaluation.evaluation_store import get_result, list_results, save_result
from schemas.evaluation import EvaluationResult, EvaluationSaveRequest

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.post("/save", response_model=EvaluationResult)
async def save_evaluation(request: EvaluationSaveRequest) -> EvaluationResult:
    record = save_result(request.dict())
    return EvaluationResult(**record)


@router.get("/list", response_model=list[EvaluationResult])
async def list_evaluations() -> list[EvaluationResult]:
    return [EvaluationResult(**record) for record in list_results()]


@router.get("/{record_id}", response_model=EvaluationResult)
async def get_evaluation(record_id: str) -> EvaluationResult:
    record = get_result(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return EvaluationResult(**record)
