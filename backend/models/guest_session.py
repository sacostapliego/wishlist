from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
import uuid
from datetime import datetime

from .base import Base

class GuestSession(Base):
    """
    An account-less identity, scoped to a single wishlist.

    A guest types their name once and the server hands back a random token that
    the client keeps. That token - not the display name - is what proves the
    guest owns their claims and (later) their contributions. Only the hash is
    stored, so a database leak does not let anyone impersonate a guest.
    """

    __tablename__ = 'guest_sessions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wishlist_id = Column(UUID(as_uuid=True), ForeignKey('wishlists.id', ondelete='CASCADE'), nullable=False)

    display_name = Column(String, nullable=False)
    email = Column(String, nullable=True)  # optional, reserved for magic-link recovery
    token_hash = Column(String, nullable=False, unique=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen_at = Column(DateTime(timezone=True), nullable=True)

    wishlist = relationship('Wishlist')

Index('guest_sessions_wishlist_id_idx', GuestSession.wishlist_id)

# Pydantic models
class GuestSessionCreate(BaseModel):
    wishlist_id: uuid.UUID
    display_name: str
    email: Optional[EmailStr] = None

class GuestSessionResponse(BaseModel):
    """The token is returned exactly once, at creation."""
    id: uuid.UUID
    wishlist_id: uuid.UUID
    display_name: str
    token: str

class GuestSessionMe(BaseModel):
    id: uuid.UUID
    wishlist_id: uuid.UUID
    display_name: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
