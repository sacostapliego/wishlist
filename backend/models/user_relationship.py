import enum
from sqlalchemy import Column, ForeignKey, DateTime, String, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime

from .base import Base

class RelationshipStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted" 
    BLOCKED = "blocked"

class UserRelationship(Base):
    __tablename__ = 'user_relationships'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    friend_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    status = Column(Enum(RelationshipStatus), nullable=False, default=RelationshipStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Remove the problematic relationships for now
    # We'll add them back properly after fixing the User model

# Pydantic models
class RelationshipBase(BaseModel):
    friend_id: uuid.UUID

class RelationshipCreate(RelationshipBase):
    pass

class RelationshipUpdate(BaseModel):
    status: Optional[RelationshipStatus] = None

class RelationshipResponse(RelationshipBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    user_id: uuid.UUID
    status: RelationshipStatus
    created_at: datetime
    updated_at: Optional[datetime] = None