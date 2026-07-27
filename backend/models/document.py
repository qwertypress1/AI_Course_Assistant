import enum
import uuid
from sqlalchemy import Column, String, Integer, BigInteger, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base


class DocumentStatus(str, enum.Enum):
    pending    = "pending"
    processing = "processing"
    ready      = "ready"
    failed     = "failed"


class Document(Base):
    __tablename__ = "documents"

    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default="uuid_generate_v4()")
    course_id          = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by        = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    filename           = Column(String(500), nullable=False)
    original_name      = Column(String(500), nullable=False)
    mime_type          = Column(String(100), nullable=False)
    file_size_bytes    = Column(BigInteger, nullable=False)
    storage_path       = Column(String(1000), nullable=False)
    page_count         = Column(Integer)
    chunk_count        = Column(Integer, default=0)
    status             = Column(SAEnum("pending", "processing", "ready", "failed", name="document_status"), nullable=False, default="pending", index=True)
    error_message      = Column(Text)
    processing_time_ms = Column(Integer)
    created_at         = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at         = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    course   = relationship("Course", back_populates="documents")
    uploader = relationship("User", back_populates="documents", foreign_keys=[uploaded_by])
