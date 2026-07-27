import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"
    __table_args__ = (
        UniqueConstraint("course_id", "user_id", name="uq_enrollment"),
    )

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default="uuid_generate_v4()")
    course_id   = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role        = Column(String(20), nullable=False, default="student")
    enrolled_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    course = relationship("Course", back_populates="enrollments")
    user   = relationship("User", back_populates="enrollments", foreign_keys=[user_id])
