import uuid
from sqlalchemy import Column, String, Text, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from db import Base


class SystemConfig(Base):
    __tablename__ = "system_config"
    __table_args__ = (
        UniqueConstraint("key", name="uq_config_key"),
    )

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default="uuid_generate_v4()")
    key         = Column(String(100), nullable=False, unique=True)
    value       = Column(Text, nullable=False)
    description = Column(Text)
    created_at  = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
