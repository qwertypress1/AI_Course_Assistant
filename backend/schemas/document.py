from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import datetime


class DocumentUploadResponse(BaseModel):
    id: UUID
    filename: str
    original_name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentStatusResponse(BaseModel):
    id: UUID
    status: str
    page_count: Optional[int]
    chunk_count: int
    error_message: Optional[str]
    processing_time_ms: Optional[int]

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    id: UUID
    original_name: str
    mime_type: str
    file_size_bytes: int
    status: str
    page_count: Optional[int]
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True
