from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
import uuid
from datetime import datetime

from .base import Base

class Wishlist(Base):
    __tablename__ = 'wishlists'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    color = Column(String(7))  # HEX color code
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship('User', back_populates='wishlists')
    items = relationship('WishListItem', back_populates='wishlist', cascade='all, delete-orphan')

# Update the User model to include a relationship with wishlists
from .user import User
User.wishlists = relationship('Wishlist', back_populates='user', cascade='all, delete-orphan')

# Pydantic models
class WishlistBase(BaseModel):
    title: str
    description: Optional[str] = None
    color: Optional[str] = None
    is_public: bool = False

class WishlistCreate(WishlistBase):
    pass

class WishlistUpdate(WishlistBase):
    title: Optional[str] = None
    is_public: Optional[bool] = None

class WishlistResponse(WishlistBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    item_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)