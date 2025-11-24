"""Authentication router providing registration and login endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db_session
from models import User
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from services.auth import create_jwt, hash_password, verify_password


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db_session)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(email=payload.email, name=payload.name, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_jwt(user.id)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db_session)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_jwt(user.id)
    return TokenResponse(access_token=token)
