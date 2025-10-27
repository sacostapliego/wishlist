from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from sqlalchemy.dialects.postgresql import UUID
import uuid

from pydantic import BaseModel, ConfigDict, HttpUrl
from typing import Optional, Union
from datetime import datetime

from .base import Base

# Model for Wish List Item
class WishListItem(Base):
    
    __tablename__ = 'wishlist_items'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    wishlist_id = Column(UUID(as_uuid=True), ForeignKey('wishlists.id'), nullable=True)
  
    # item details
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float)
    url = Column(String)
    image = Column(String)
    is_purchased = Column(Boolean, default=False)
    priority = Column(Integer, default=0)
    
    # claiming functionality
    claimed_by_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    claimed_by_name = Column(String, nullable=True)  # For non-registered users
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    
    # timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationships
    user = relationship('User', back_populates='wishlist_items', foreign_keys=[user_id])
    wishlist = relationship('Wishlist', back_populates='items')
    claimed_by_user = relationship('User', foreign_keys=[claimed_by_user_id])
    
# Pydantic models
class WishListItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    url: Optional[str] = None
    image: Optional[str] = None
    is_purchased: bool = False
    priority: int = 0
    wishlist_id: Optional[uuid.UUID] = None
    
class WishListItemCreate(WishListItemBase):
    pass

class WishListItemUpdate(WishListItemBase):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    url: Optional[str] = None
    image: Optional[str] = None
    is_purchased: Optional[bool] = None
    priority: Optional[int] = None
    wishlist_id: Optional[uuid.UUID] = None

class WishListItemResponse(WishListItemBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    image: Optional[str] = None
    
    claimed_by_user_id: Optional[uuid.UUID] = None
    claimed_by_name: Optional[str] = None
    claimed_at: Optional[datetime] = None
    
    claimed_by_display_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
    
class ScrapeRequest(BaseModel):
    url: HttpUrl
    
class ClaimRequest(BaseModel):
    user_id: Optional[str] = None
    guest_name: Optional[str] = None