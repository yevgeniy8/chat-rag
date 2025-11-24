"""Database session and engine setup for the FastAPI backend."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from settings import settings


db_path = settings.database_path
db_path.parent.mkdir(parents=True, exist_ok=True)


engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db_session():
    """FastAPI dependency that yields a scoped session."""

    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
