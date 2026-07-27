import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default="uuid_generate_v4()")
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id  = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title      = Column(String(255), default="New Chat")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user     = relationship("User", back_populates="chat_sessions")
    course   = relationship("Course", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default="uuid_generate_v4()")
    session_id       = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role             = Column(String(10), nullable=False)   # 'user', 'assistant', 'system'
    content          = Column(Text, nullable=False)
    sources          = Column(JSONB, default=list)
    tokens_used      = Column(Integer, default=0)
    model_used       = Column(String(50))
    embedding_tokens = Column(Integer, default=0)
    created_at       = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")
