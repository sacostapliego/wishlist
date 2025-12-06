from sqlalchemy import Column, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

from .base import Base

class SavedWishlist(Base):
    __tablename__ = 'saved_wishlists'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    wishlist_id = Column(UUID(as_uuid=True), ForeignKey('wishlists.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Prevent duplicate saves
    __table_args__ = (
        UniqueConstraint('user_id', 'wishlist_id', name='unique_user_wishlist'),
    )

    # Relationships
    user = relationship('User', back_populates='saved_wishlists')
    wishlist = relationship('Wishlist')

# Pydantic models
class SavedWishlistCreate(BaseModel):
    wishlist_id: uuid.UUID

class SavedWishlistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    user_id: uuid.UUID
    wishlist_id: uuid.UUID
    created_at: datetime