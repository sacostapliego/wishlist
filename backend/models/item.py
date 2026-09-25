from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from sqlalchemy.dialects.postgresql import UUID
import uuid

from pydantic import BaseModel, ConfigDict, HttpUrl
from typing import Optional, Union
from datetime import datetime

from .base import Base
from .guest_session import GuestSession  # noqa: F401  (registers the mapper for the relationship below)

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
    claimed_by_guest_session_id = Column(UUID(as_uuid=True), ForeignKey('guest_sessions.id', ondelete='SET NULL'), nullable=True)
    claimed_by_name = Column(String, nullable=True)  # legacy: guest claims made before guest sessions
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    # The wishlist's visibility_mode at the moment of the claim. A claim made
    # while the list was blind stays hidden from the owner even if they later
    # switch the list to open - they cannot retroactively break the promise the
    # claimer acted on. NULL means a claim from before this column existed,
    # which is treated as blind.
    claimed_under_mode = Column(String(10), nullable=True)
    
    # timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationships
    user = relationship('User', back_populates='wishlist_items', foreign_keys=[user_id])
    wishlist = relationship('Wishlist', back_populates='items')
    claimed_by_user = relationship('User', foreign_keys=[claimed_by_user_id])
    claimed_by_guest_session = relationship('GuestSession', foreign_keys=[claimed_by_guest_session_id])
    
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
    
    claimed_at: Optional[datetime] = None
    
    # Who claimed it, resolved to a display name. Never the raw identity fields -
    # those stay server-side so claim visibility can be controlled per wishlist.
    claimed_by_display_name: Optional[str] = None
    is_claimed: bool = False
    
    # True when the requester (member or guest) is the one who claimed it.
    # The client uses this to decide whether to offer 'Unclaim'.
    claimed_by_viewer: bool = False
    
    model_config = ConfigDict(from_attributes=True)
    
class ScrapeRequest(BaseModel):
    url: HttpUrl