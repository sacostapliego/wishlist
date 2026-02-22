from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
import uuid
from datetime import datetime

from .base import Base

class Wishlist(Base):
    __tablename__ = 'wishlists'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    image: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # Thumbnail fields
    thumbnail_type: Mapped[Optional[str]] = mapped_column(String(10), default='icon', nullable=True)
    thumbnail_icon: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    thumbnail_image: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship('User', back_populates='wishlists')
    items = relationship('WishListItem', back_populates='wishlist', cascade='all, delete-orphan')

from .user import User
User.wishlists = relationship('Wishlist', back_populates='user', cascade='all, delete-orphan')

class WishlistBase(BaseModel):
    title: str
    description: Optional[str] = None
    color: Optional[str] = None
    is_public: bool = False
    image: Optional[str] = None
    thumbnail_type: Optional[str] = 'icon'
    thumbnail_icon: Optional[str] = None

class WishlistCreate(WishlistBase):
    pass

class WishlistUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_public: Optional[bool] = None
    image: Optional[str] = None
    thumbnail_type: Optional[str] = None
    thumbnail_icon: Optional[str] = None

class WishlistResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: Optional[str] = None
    color: Optional[str] = None
    is_public: bool = False
    image: Optional[str] = None
    thumbnail_type: Optional[str] = 'icon'
    thumbnail_icon: Optional[str] = None
    thumbnail_image: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    item_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)