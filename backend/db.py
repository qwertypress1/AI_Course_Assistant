from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from fastapi import HTTPException, status

Base = declarative_base()

_engine = None
_SessionLocal = None


def _get_engine():
    """Lazy-initialise the SQLAlchemy engine on first use with clear error handling and local SQLite fallback."""
    global _engine, _SessionLocal
    if _engine is None:
        from config import get_settings
        settings = get_settings()
        db_url = settings.database_url or "sqlite:///./test_sqlite.db"
        
        if db_url.startswith("sqlite"):
            _engine = create_engine(db_url, connect_args={"check_same_thread": False})
            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
            return _engine, _SessionLocal

        # Convert postgresql:// to postgresql+psycopg:// for psycopg3
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
        elif db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)

        try:
            _engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
            )
            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
        except Exception as e:
            print(f"[DB Warning] Could not connect to PostgreSQL ({e}). Falling back to local SQLite database.")
            _engine = create_engine("sqlite:///./test_sqlite.db", connect_args={"check_same_thread": False})
            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
            
    return _engine, _SessionLocal


def get_db():
    """FastAPI dependency — yields a DB session and closes it after the request."""
    _, SessionLocal = _get_engine()
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
