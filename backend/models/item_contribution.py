from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
import uuid
from datetime import datetime

from .base import Base
from .guest_session import GuestSession  # noqa: F401  (registers the mapper for the relationship below)

# The longest note we will store. Long enough for "from the Wilson family",
# short enough that it cannot be used as free storage.
MAX_NOTE_LENGTH = 280

class ItemContribution(Base):
    """
    One person's pledge toward a contribution item.

    Honor system: no money moves through the app. A pledge says "I intend to put
    in this much", and the app links out to the real store.

    Identity has the same shape as a claim - a member or a guest, never both -
    but with two real foreign keys rather than the claims table's free-text
    legacy name. That is what makes "edit my pledge" the same permission check
    as unclaiming, and it is why guest contributors need nothing new: they reuse
    the guest sessions built for claiming.

    The owner's own declared head start is NOT a row here. It lives on the item
    as `owner_seed_amount`, so the query that hides contributions from a blind
    owner needs no exception carved out for the owner's own row.
    """

    __tablename__ = 'item_contributions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey('wishlist_items.id', ondelete='CASCADE'), nullable=False)

    # Exactly one of these is set; the check constraint below is the guarantee.
    # Both cascade on delete rather than nulling, because a NULLed identity
    # would leave a row that belongs to nobody and satisfies neither half.
    contributor_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    guest_session_id = Column(UUID(as_uuid=True), ForeignKey('guest_sessions.id', ondelete='CASCADE'), nullable=True)

    amount = Column(Float, nullable=False)
    note = Column(String(MAX_NOTE_LENGTH), nullable=True)

    # The wishlist's visibility_mode at the moment of the pledge, for the same
    # reason WishListItem.claimed_under_mode exists: an owner who later opens a
    # blind list does not get to retroactively see pledges people made believing
    # the owner could not. NULL is treated as blind.
    contributed_under_mode = Column(String(10), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(
            '(contributor_user_id IS NOT NULL) <> (guest_session_id IS NOT NULL)',
            name='item_contributions_one_identity_check'
        ),
        CheckConstraint('amount > 0', name='item_contributions_amount_check'),
    )

    # relationships
    item = relationship('WishListItem', back_populates='contributions')
    contributor_user = relationship('User', foreign_keys=[contributor_user_id])
    guest_session = relationship('GuestSession', foreign_keys=[guest_session_id])

Index('item_contributions_item_id_idx', ItemContribution.item_id)

# Pydantic models
class ItemContributionCreate(BaseModel):
    amount: float = Field(gt=0)
    note: Optional[str] = Field(default=None, max_length=MAX_NOTE_LENGTH)

class ItemContributionUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    note: Optional[str] = Field(default=None, max_length=MAX_NOTE_LENGTH)

class ItemContributionResponse(BaseModel):
    """
    A pledge as the API returns it. Like a claim, the raw identity columns never
    leave the server - only a display name and whether the person asking is the
    one who pledged.
    """
    id: uuid.UUID
    amount: float
    note: Optional[str] = None
    created_at: Optional[datetime] = None

    contributor_display_name: Optional[str] = None
    # True when the requester (member or guest) made this pledge. The client
    # uses it to decide whether to offer 'Edit' and 'Withdraw'.
    is_mine: bool = False

    model_config = ConfigDict(from_attributes=True)
