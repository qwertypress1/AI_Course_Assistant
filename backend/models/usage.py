import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default="uuid_generate_v4()")
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action           = Column(String(50), nullable=False, index=True)
    resource_type    = Column(String(50), nullable=False)
    resource_id      = Column(UUID(as_uuid=True))
    tokens_input     = Column(Integer, default=0)
    tokens_output    = Column(Integer, default=0)
    embedding_tokens = Column(Integer, default=0)
    model_used       = Column(String(50))
    latency_ms       = Column(Integer)
    cost_usd         = Column(Numeric(10, 6), default=0)
    metadata_        = Column("metadata", JSONB, default=dict)
    created_at       = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", back_populates="usage_logs")
