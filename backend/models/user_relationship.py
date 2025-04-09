from sqlalchemy import Column, ForeignKey, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime

from .base import Base
from .user import User

class UserRelationship(Base):
    __tablename__ = 'user_relationships'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    friend_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending, accepted, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship('User', foreign_keys=[user_id], backref='initiated_relationships')
    friend = relationship('User', foreign_keys=[friend_id], backref='received_relationships')

# Pydantic models
class RelationshipBase(BaseModel):
    friend_id: uuid.UUID

class RelationshipCreate(RelationshipBase):
    pass

class RelationshipUpdate(BaseModel):
    status: Optional[str] = None

class RelationshipResponse(RelationshipBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    created_at: datetime
    friend_username: Optional[str] = None
    friend_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)