import enum
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base


class UserRole(str, enum.Enum):
    student = "student"
    lecturer = "lecturer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default="uuid_generate_v4()")
    email         = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name     = Column(String(255), nullable=False)
    role          = Column(SAEnum("student", "lecturer", "admin", name="user_role"), nullable=False, default="student")
    is_active     = Column(Boolean, nullable=False, default=True, index=True)
    created_at    = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    courses_created = relationship("Course", back_populates="creator", foreign_keys="Course.created_by")
    enrollments     = relationship("CourseEnrollment", back_populates="user", foreign_keys="CourseEnrollment.user_id")
    documents       = relationship("Document", back_populates="uploader", foreign_keys="Document.uploaded_by")
    chat_sessions   = relationship("ChatSession", back_populates="user")
    usage_logs      = relationship("UsageLog", back_populates="user")
