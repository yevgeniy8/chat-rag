"""Authentication helpers: hashing, JWT creation, and user dependency."""

from __future__ import annotations

from datetime import datetime, timedelta

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db_session
from models import User
from settings import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_jwt(user_id: int, expires_minutes: int = 60 * 24) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=expires_minutes),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db_session),
) -> int:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing credentials")
    token = credentials.credentials
    payload = decode_jwt(token)
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user.id
