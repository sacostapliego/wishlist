import uuid
from typing import List, Optional

from models.item import WishListItem, WishListItemResponse

def serialize_item(
    item: WishListItem,
    viewer_user_id: Optional[uuid.UUID] = None,
    viewer_guest_session_id: Optional[uuid.UUID] = None
) -> WishListItemResponse:
    """
    Single place where an item becomes an API response.

    Claim identity is deliberately resolved here rather than in each route: the
    raw claimer ids never leave the server, only a display name and whether the
    person asking is the one who claimed it. When per-wishlist claim visibility
    lands, this is the one function that has to learn about it.
    """
    item_dict = WishListItemResponse.model_validate(item).model_dump()

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
