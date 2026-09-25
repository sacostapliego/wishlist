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
from .item_contribution import ItemContribution  # noqa: F401  (same)

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

    # contribution functionality
    # A contribution item is chipped in toward by several people instead of
    # bought outright by one. Mutually exclusive with claiming - an item must
    # never be both 60% funded and claimed. The item's `price` doubles as the
    # goal; price being NULL is the 'no target, running total only' case.
    is_contribution = Column(Boolean, default=False, nullable=False)
    # The owner's own declared head start ('$2,000 down on a $5,000 car'),
    # visible to visitors. A column rather than a row in item_contributions, so
    # the rule that hides contributions from a blind owner needs no exception
    # carved out for the owner's own row.
    owner_seed_amount = Column(Float, nullable=True)
    
    # timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationships
    user = relationship('User', back_populates='wishlist_items', foreign_keys=[user_id])
    wishlist = relationship('Wishlist', back_populates='items')
    claimed_by_user = relationship('User', foreign_keys=[claimed_by_user_id])
    claimed_by_guest_session = relationship('GuestSession', foreign_keys=[claimed_by_guest_session_id])
    contributions = relationship(
        'ItemContribution',
        back_populates='item',
        cascade='all, delete-orphan'
    )
    
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
    # When true, `price` (if set) is the funding goal. See ItemContribution.
    is_contribution: bool = False
    owner_seed_amount: Optional[float] = None
    
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
    is_contribution: Optional[bool] = None
    owner_seed_amount: Optional[float] = None

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

    # Contribution summary. Only the totals live here; the individual pledges
    # come from GET /wishlist/{item_id}/contributions, so a list of forty items
    # does not drag every pledge along with it.
    #
    # owner_seed_amount is counted in contribution_total but never in
    # contribution_count - the count is 'how many other people have chipped in'.
    contribution_total: Optional[float] = None
    contribution_count: Optional[int] = None

    # True when this viewer is the owner of a blind list, so the figures above
    # have been withheld. Safe to expose because it does not vary with whether
    # anyone has actually pledged - it says 'you cannot see this', not
    # 'there is something to see'. The client uses it to explain the blank
    # rather than render '$0 of $5,000' as though nobody had contributed.
    contributions_hidden: bool = False
    
    model_config = ConfigDict(from_attributes=True)
    
class ScrapeRequest(BaseModel):
    url: HttpUrl