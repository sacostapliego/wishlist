import uuid
from typing import List, Optional

from models.item import WishListItem, WishListItemResponse
from models.wishlist import Wishlist

# A wishlist whose owner must not see who claimed what. The default everywhere,
# because revealing a claim by accident cannot be undone.
BLIND = 'blind'

def _hides_claims_from(item: WishListItem, viewer_user_id: Optional[uuid.UUID]) -> bool:
    """
    True when this viewer is the list's owner and the list is blind.

    A missing wishlist is treated as blind: an item with no list cannot be
    claimed through a shared page anyway, and defaulting to hidden means a
    future code path that forgets to load the relationship leaks nothing.
    """
    if viewer_user_id is None or item.user_id != viewer_user_id:
        return False

    wishlist: Optional[Wishlist] = item.wishlist
    mode = wishlist.visibility_mode if wishlist else BLIND

    return mode == BLIND

def serialize_item(
    item: WishListItem,
    viewer_user_id: Optional[uuid.UUID] = None,
    viewer_guest_session_id: Optional[uuid.UUID] = None
) -> WishListItemResponse:
    """
    Single place where an item becomes an API response.

    Claim identity is deliberately resolved here rather than in each route: the
    raw claimer ids never leave the server, only a display name and whether the
    person asking is the one who claimed it.

    This is also where blind mode is enforced. To the owner of a blind list, a
    claimed item must be indistinguishable from an unclaimed one - not just
    missing the name, but showing no claim, no timestamp, nothing that differs
    between zero claims and one. Anything that varies with claim state is a leak.
    """
    item_dict = WishListItemResponse.model_validate(item).model_dump()

    if _hides_claims_from(item, viewer_user_id):
        item_dict['claimed_by_display_name'] = None
        item_dict['is_claimed'] = False
        item_dict['claimed_by_viewer'] = False
        item_dict['claimed_at'] = None
        return WishListItemResponse(**item_dict)

    display_name = None
    if item.claimed_by_user_id and item.claimed_by_user:
        display_name = item.claimed_by_user.name or item.claimed_by_user.username
    elif item.claimed_by_guest_session_id and item.claimed_by_guest_session:
        display_name = item.claimed_by_guest_session.display_name
    elif item.claimed_by_name:
        # legacy guest claim, made before guest sessions existed
        display_name = item.claimed_by_name

    is_claimed = bool(
        item.claimed_by_user_id or item.claimed_by_guest_session_id or item.claimed_by_name
    )

    claimed_by_viewer = False
    if viewer_user_id and item.claimed_by_user_id:
        claimed_by_viewer = item.claimed_by_user_id == viewer_user_id
    elif viewer_guest_session_id and item.claimed_by_guest_session_id:
        claimed_by_viewer = item.claimed_by_guest_session_id == viewer_guest_session_id

    item_dict['claimed_by_display_name'] = display_name
    item_dict['is_claimed'] = is_claimed
    item_dict['claimed_by_viewer'] = claimed_by_viewer

    return WishListItemResponse(**item_dict)

def serialize_items(
    items: List[WishListItem],
    viewer_user_id: Optional[uuid.UUID] = None,
    viewer_guest_session_id: Optional[uuid.UUID] = None
) -> List[WishListItemResponse]:
    return [
        serialize_item(item, viewer_user_id, viewer_guest_session_id)
        for item in items
    ]
