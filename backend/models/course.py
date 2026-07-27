import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base


class Course(Base):
    __tablename__ = "courses"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default="uuid_generate_v4()")
    name        = Column(String(255), nullable=False)
    code        = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text)
    created_by  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    is_active   = Column(Boolean, nullable=False, default=True)
    created_at  = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    creator     = relationship("User", back_populates="courses_created", foreign_keys=[created_by])
    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")
    documents   = relationship("Document", back_populates="course", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="course", cascade="all, delete-orphan")
