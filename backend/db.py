from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from fastapi import HTTPException, status

Base = declarative_base()

_engine = None
_SessionLocal = None


def _get_engine():
    """Lazy-initialise the SQLAlchemy engine on first use with clear error handling."""
    global _engine, _SessionLocal
    if _engine is None:
        from config import get_settings
        settings = get_settings()
        db_url = settings.database_url
        
        if not db_url or "REPLACE_WITH" in db_url or not db_url.startswith("postgres"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="DATABASE_URL is not configured in backend/.env. Please update DATABASE_URL with your Supabase PostgreSQL connection string."
            )
            
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
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to connect to database: {str(e)}"
            )
            
    return _engine, _SessionLocal


def get_db():
    """FastAPI dependency — yields a DB session and closes it after the request."""
    _, SessionLocal = _get_engine()
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
