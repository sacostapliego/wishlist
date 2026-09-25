import uuid
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload

from models.base import get_db
from models.wishlist import Wishlist
from models.item import WishListItem, WishListItemResponse
from models.item_contribution import (
    ItemContribution,
    ItemContributionCreate,
    ItemContributionUpdate,
    ItemContributionResponse,
)
from middleware.auth import get_current_user_optional
from services.guest_session import get_guest_token, resolve_guest_session
from services.item_serializer import serialize_item, serialize_contributions

# Same prefix as the items router: a pledge is an act on an item, and the URL
# says so. Split into its own module only to keep items.py from growing again.
router = APIRouter(prefix='/wishlist', tags=['contributions'])

def _load_item(db: Session, item_id: uuid.UUID) -> WishListItem:
    """
    Fetch an item with everything the serializer needs - the wishlist for its
    visibility mode, and the pledges for the totals.
    """
    item = db.query(WishListItem).options(
        joinedload(WishListItem.wishlist),
        joinedload(WishListItem.claimed_by_user),
        joinedload(WishListItem.claimed_by_guest_session),
        selectinload(WishListItem.contributions).joinedload(ItemContribution.contributor_user),
        selectinload(WishListItem.contributions).joinedload(ItemContribution.guest_session),
    ).filter(WishListItem.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail='Item not found')

    return item

def _require_shared_wishlist(db: Session, item: WishListItem) -> Wishlist:
    """
    Pledging happens on a shared list, exactly like claiming: knowing an item id
    is not permission to touch it.
    """
    wishlist = db.query(Wishlist).filter(
        Wishlist.id == item.wishlist_id,
        Wishlist.is_public == True
    ).first()

    if not wishlist:
        raise HTTPException(status_code=404, detail='Item is not on a shared wishlist')

    return wishlist

def _require_contribution_item(item: WishListItem) -> None:
    """
    Contributing and claiming are mutually exclusive. Rejecting here - and
    rejecting contribution items in claim_item - is what stops an item ending up
    both 60% funded and claimed by one person.
    """
    if not item.is_contribution:
        raise HTTPException(
            status_code=400,
            detail='This item is not accepting contributions'
        )

    if item.claimed_by_user_id or item.claimed_by_guest_session_id or item.claimed_by_name:
        # Should be unreachable: the routes refuse to claim a contribution item
        # and a database constraint refuses the combination outright.
        raise HTTPException(
            status_code=400,
            detail='This item has already been claimed'
        )

def _viewer(
    db: Session,
    item: WishListItem,
    current_user: Optional[dict],
    guest_token: Optional[str]
) -> Tuple[Optional[uuid.UUID], Optional[uuid.UUID]]:
    """
    Who is asking, as (user_id, guest_session_id). At most one is set. Identity
    comes from the JWT or the X-Guest-Token header, never from the request body,
    so nobody can pledge on someone else's behalf.
    """
    if current_user:
        return uuid.UUID(current_user['user_id']), None

    guest_session = resolve_guest_session(db, guest_token, item.wishlist_id)
    return None, (guest_session.id if guest_session else None)

def _my_contribution(
    item: WishListItem,
    viewer_user_id: Optional[uuid.UUID],
    viewer_guest_session_id: Optional[uuid.UUID]
) -> Optional[ItemContribution]:
    """
    The viewer's own pledge, if any. There is at most one - a unique index per
    item per identity - which is what lets 'my pledge' be addressed without an id
    and makes editing it the same permission check as unclaiming.
    """
    for contribution in item.contributions or []:
        if viewer_user_id and contribution.contributor_user_id == viewer_user_id:
            return contribution
        if viewer_guest_session_id and contribution.guest_session_id == viewer_guest_session_id:
            return contribution

    return None

''' List the pledges on an item '''
@router.get('/{item_id}/contributions', response_model=List[ItemContributionResponse])
def read_item_contributions(
    item_id: uuid.UUID,
    current_user: Optional[dict] = Depends(get_current_user_optional),
    guest_token: Optional[str] = Depends(get_guest_token),
    db: Session = Depends(get_db)
):
    """
    Visitors and contributors see every pledge; the owner of a blind list gets an
    empty list, indistinguishable from an item nobody has pledged toward. The
    filtering lives in the serializer, not here.
    """
    item = _load_item(db, item_id)

    viewer_user_id, viewer_guest_session_id = _viewer(db, item, current_user, guest_token)

    # The owner can read their own item's pledges even before the list is shared;
    # for everyone else, the list has to be shared.
    if not (viewer_user_id and item.user_id == viewer_user_id):
        _require_shared_wishlist(db, item)

    if not item.is_contribution:
        return []

    return serialize_contributions(
        item,
        viewer_user_id=viewer_user_id,
        viewer_guest_session_id=viewer_guest_session_id
    )

''' Pledge toward a contribution item '''
@router.post('/{item_id}/contributions', response_model=WishListItemResponse)
def create_item_contribution(
    item_id: uuid.UUID,
    payload: ItemContributionCreate,
    current_user: Optional[dict] = Depends(get_current_user_optional),
    guest_token: Optional[str] = Depends(get_guest_token),
    db: Session = Depends(get_db)
):
    """
    Honor system: no money moves through the app. This records an intention, and
    the item's url is where the buying actually happens.

    Returns the item rather than the pledge, so the client gets the new total in
    the same round trip and can redraw the bar without a second request.
    """
    item = _load_item(db, item_id)
    wishlist = _require_shared_wishlist(db, item)
    _require_contribution_item(item)

    viewer_user_id, viewer_guest_session_id = _viewer(db, item, current_user, guest_token)

    if not viewer_user_id and not viewer_guest_session_id:
        raise HTTPException(
            status_code=401,
            detail='Sign in or start a guest session to contribute to this item'
        )

    # The owner declares their own head start through the item's
    # owner_seed_amount, not as a row here. Allowing an owner's pledge would put
    # a row in this table that the blind rule has to make an exception for, and
    # that exception is the privacy bug the seed column exists to prevent.
    if viewer_user_id and item.user_id == viewer_user_id:
        raise HTTPException(
            status_code=400,
            detail="Set the item's own contribution amount instead of pledging to it"
        )

    if _my_contribution(item, viewer_user_id, viewer_guest_session_id):
        raise HTTPException(
            status_code=409,
            detail='You have already contributed to this item. Edit your contribution instead'
        )

    note = payload.note.strip() if payload.note else None

    contribution = ItemContribution(
        item_id=item.id,
        contributor_user_id=viewer_user_id,
        guest_session_id=viewer_guest_session_id,
        amount=payload.amount,
        note=note or None,
        # Pinned now, not read later: if the owner opens the list afterwards,
        # this pledge stays hidden from them. Same rule as a claim.
        contributed_under_mode=wishlist.visibility_mode
    )

    db.add(contribution)
    db.commit()
    db.refresh(item)

    return serialize_item(
        item,
        viewer_user_id=viewer_user_id,
        viewer_guest_session_id=viewer_guest_session_id
    )

''' Change your own pledge '''
@router.put('/{item_id}/contributions/mine', response_model=WishListItemResponse)
def update_my_contribution(
    item_id: uuid.UUID,
    payload: ItemContributionUpdate,
    current_user: Optional[dict] = Depends(get_current_user_optional),
    guest_token: Optional[str] = Depends(get_guest_token),
    db: Session = Depends(get_db)
):
    """Only the person who made a pledge can change it."""
    item = _load_item(db, item_id)
    _require_shared_wishlist(db, item)

    viewer_user_id, viewer_guest_session_id = _viewer(db, item, current_user, guest_token)
    contribution = _my_contribution(item, viewer_user_id, viewer_guest_session_id)

    if not contribution:
        raise HTTPException(
            status_code=404,
            detail='You have not contributed to this item'
        )

    if payload.amount is not None:
        contribution.amount = payload.amount

    if payload.note is not None:
        note = payload.note.strip()
        contribution.note = note or None

    # contributed_under_mode is deliberately left alone. It records the promise
    # the pledge was made under; editing an amount does not renegotiate it, and
    # re-pinning here would hand an owner the reveal that migration 003 exists to
    # prevent - open the list, ask contributors to adjust, see everything.

    db.commit()
    db.refresh(item)

    return serialize_item(
        item,
        viewer_user_id=viewer_user_id,
        viewer_guest_session_id=viewer_guest_session_id
    )

''' Withdraw your own pledge '''
@router.delete('/{item_id}/contributions/mine', response_model=WishListItemResponse)
def delete_my_contribution(
    item_id: uuid.UUID,
    current_user: Optional[dict] = Depends(get_current_user_optional),
    guest_token: Optional[str] = Depends(get_guest_token),
    db: Session = Depends(get_db)
):
    """Only the person who made a pledge can withdraw it."""
    item = _load_item(db, item_id)
    _require_shared_wishlist(db, item)

    viewer_user_id, viewer_guest_session_id = _viewer(db, item, current_user, guest_token)
    contribution = _my_contribution(item, viewer_user_id, viewer_guest_session_id)

    if not contribution:
        raise HTTPException(
            status_code=404,
            detail='You have not contributed to this item'
        )

    db.delete(contribution)
    db.commit()
    db.refresh(item)

    return serialize_item(
        item,
        viewer_user_id=viewer_user_id,
        viewer_guest_session_id=viewer_guest_session_id
    )
