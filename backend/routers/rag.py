"""Routers for uploads, retrieval, and chat history with user isolation."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db_session
from models import ChatMessage, File as FileModel
from schemas.rag import FileItem, HistoryItem, RagRequest, RagResponse, UploadResponse
from services.auth import get_current_user
from services.rag_pipeline import build_context, chunk_text, clean_text, index_chunks, retrieve_context
from services import loader
from settings import settings
from services import llm


router = APIRouter(tags=["rag"])


def _user_files_dir(user_id: int) -> Path:
    path = settings.files_dir / f"user_{user_id}"
    path.mkdir(parents=True, exist_ok=True)
    return path


@router.post("/upload", response_model=UploadResponse)
async def upload(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> UploadResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")
    stored_name = f"{datetime.utcnow().timestamp()}_{file.filename}"
    target_dir = _user_files_dir(user_id)
    destination = target_dir / stored_name
    content = await file.read()
    destination.write_bytes(content)

    document = loader.load_document(destination)
    cleaned = clean_text(document.text)
    chunks = chunk_text(cleaned, max_tokens=settings.chunk_size, overlap=settings.chunk_overlap)

    file_record = FileModel(
        user_id=user_id,
        original_name=file.filename,
        stored_name=stored_name,
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    new_chunks = index_chunks(user_id, file_record.id, chunks)
    db.add_all(new_chunks)
    db.commit()

    return UploadResponse(
        file_id=file_record.id,
        original_name=file_record.original_name,
        stored_name=file_record.stored_name,
        created_at=file_record.created_at,
    )


@router.post("/rag", response_model=RagResponse)
async def rag_chat(
    payload: RagRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> RagResponse:
    k = payload.top_k or settings.default_top_k
    retrieved = retrieve_context(user_id, payload.question, k=k, db=db)
    context = build_context(retrieved)
    if not context:
        context = ""
    messages = [
        ChatMessage(user_id=user_id, role="user", content=payload.question),
    ]
    db.add_all(messages)
    db.commit()

    prompt = (
        "You are an AI assistant that must answer strictly using the provided context.\n"
        "If the answer exists in the context, extract it and answer concisely.\n"
        "If the context does not contain the answer, say:\n"
        '"I don’t have enough information in the provided documents."\n\n'
        f"Context:\n{context}\n\nUser question:\n{payload.question}\n\nFinal answer:"
    )
    answer = await llm.generate_with_prompt(prompt)

    assistant_msg = ChatMessage(user_id=user_id, role="assistant", content=answer)
    db.add(assistant_msg)
    db.commit()

    return RagResponse(answer=answer, context=context, retrieved_chunks=[c.get("chunk_text", "") for c in retrieved])


@router.get("/files", response_model=List[FileItem])
def list_files(user_id: int = Depends(get_current_user), db: Session = Depends(get_db_session)) -> List[FileItem]:
    records = (
        db.query(FileModel)
        .filter(FileModel.user_id == user_id)
        .order_by(FileModel.created_at.desc())
        .all()
    )
    return [
        FileItem(id=record.id, original_name=record.original_name, stored_name=record.stored_name, created_at=record.created_at)
        for record in records
    ]


@router.get("/history", response_model=List[HistoryItem])
def history(user_id: int = Depends(get_current_user), db: Session = Depends(get_db_session)) -> List[HistoryItem]:
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .all()
    )
    return [
        HistoryItem(id=msg.id, role=msg.role, content=msg.content, created_at=msg.created_at)
        for msg in messages
    ]
