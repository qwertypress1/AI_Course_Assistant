from pydantic import BaseModel, field_validator
from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime


class ChatMessageRequest(BaseModel):
    message: str

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty")
        if len(v) > 2000:
            raise ValueError("Message cannot exceed 2000 characters")
        return v


class CreateSessionRequest(BaseModel):
    course_id: Optional[UUID] = None
    title: Optional[str] = "New Chat"


class MessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    sources: List[Any] = []
    tokens_used: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: Optional[UUID] = None
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
