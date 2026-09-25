import uuid
from typing import List, Optional

from models.item import WishListItem, WishListItemResponse
from models.item_contribution import ItemContribution, ItemContributionResponse
from models.wishlist import Wishlist

# A wishlist whose owner must not see who claimed what. The default everywhere,
# because revealing a claim by accident cannot be undone.
BLIND = 'blind'
OPEN = 'open'

def _list_mode(item: WishListItem) -> str:
    """
    The visibility mode of the list this item belongs to.

    A missing wishlist is treated as blind, so a code path that forgets to
    eager-load the relationship leaks nothing.
    """
    wishlist: Optional[Wishlist] = item.wishlist
    return wishlist.visibility_mode if wishlist else BLIND

def _is_owner(item: WishListItem, viewer_user_id: Optional[uuid.UUID]) -> bool:
    return viewer_user_id is not None and item.user_id == viewer_user_id

def _owner_may_see(list_mode: str, recorded_mode: Optional[str]) -> bool:
    """
    The both-open rule, shared by claims and contributions.

    The owner sees an act of generosity only when BOTH are open: the list is
    open now, and it was open when the act happened. The second half is what
    stops an owner flipping a blind list to open and retroactively seeing what
    people did believing it was hidden - they acted on a promise, and the owner
    does not get to withdraw it after the fact.

    A NULL recorded mode - one from before the column existed - is treated as
    blind, because everything recorded back then was recorded on a list the app
    presented as blind.
    """
    return list_mode == OPEN and (recorded_mode or BLIND) == OPEN

def _hides_claims_from(item: WishListItem, viewer_user_id: Optional[uuid.UUID]) -> bool:
    """True when this viewer is the list's owner and must not see this claim."""
    if not _is_owner(item, viewer_user_id):
        return False

    return not _owner_may_see(_list_mode(item), item.claimed_under_mode)

def _visible_contributions(
    item: WishListItem,
    viewer_user_id: Optional[uuid.UUID]
) -> List[ItemContribution]:
    """
    The pledges this viewer is allowed to know about.

    Everyone but the owner sees all of them - contributors and visitors always
    see the full picture, since the point of a contribution item is coordinating
    with each other. The owner sees a pledge only under the both-open rule.

    Filtering per pledge rather than all-or-nothing matters: a blind-era pledge
    stays hidden even after the list is opened, so an owner's total can be lower
    than a visitor's. That is the honest number for what the owner is entitled to
    know, and it does not vary with what they are not.
    """
    contributions: List[ItemContribution] = list(item.contributions or [])

    if not _is_owner(item, viewer_user_id):
        return contributions

    list_mode = _list_mode(item)
    return [
        c for c in contributions
        if _owner_may_see(list_mode, c.contributed_under_mode)
    ]

def _contribution_summary(
    item: WishListItem,
    viewer_user_id: Optional[uuid.UUID]
) -> dict:
    """
    The totals shown on a contribution item.

    The owner's own seed amount is always counted, for every viewer including a
    blind owner - they declared it themselves, so it cannot tell them anything
    they did not already know, and it is a column on the item precisely so this
    function needs no exception carved out for it. It is deliberately left out of
    the count: the count answers 'how many other people have chipped in'.

    To a blind owner the figures are therefore identical whether ten people have
    pledged or nobody has.
    """
    seed = item.owner_seed_amount or 0.0
    visible = _visible_contributions(item, viewer_user_id)

    return {
        'contribution_total': seed + sum(c.amount for c in visible),
        'contribution_count': len(visible),
        # Says 'you cannot see this', not 'there is something to see' - true for
        # a blind owner whether or not anyone has pledged.
        'contributions_hidden': (
            _is_owner(item, viewer_user_id) and _list_mode(item) != OPEN
        ),
    }

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
    The same holds for contributions: no total beyond the owner's own seed, no
    contributor count, nothing a progress bar could be drawn from.
    """
    item_dict = WishListItemResponse.model_validate(item).model_dump()

    if item.is_contribution:
        item_dict.update(_contribution_summary(item, viewer_user_id))

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

def serialize_contribution(
    contribution: ItemContribution,
    viewer_user_id: Optional[uuid.UUID] = None,
    viewer_guest_session_id: Optional[uuid.UUID] = None
) -> ItemContributionResponse:
    """
    One pledge as the API returns it. As with claims, the raw identity columns
    stay server-side; only a display name and 'is this mine' go out.
    """
    display_name = None
    if contribution.contributor_user_id and contribution.contributor_user:
        user = contribution.contributor_user
        display_name = user.name or user.username
    elif contribution.guest_session_id and contribution.guest_session:
        display_name = contribution.guest_session.display_name

    is_mine = False
    if viewer_user_id and contribution.contributor_user_id:
        is_mine = contribution.contributor_user_id == viewer_user_id
    elif viewer_guest_session_id and contribution.guest_session_id:
        is_mine = contribution.guest_session_id == viewer_guest_session_id

    return ItemContributionResponse(
        id=contribution.id,
        amount=contribution.amount,
        note=contribution.note,
        created_at=contribution.created_at,
        contributor_display_name=display_name,
        is_mine=is_mine
    )

def serialize_contributions(
    item: WishListItem,
    viewer_user_id: Optional[uuid.UUID] = None,
    viewer_guest_session_id: Optional[uuid.UUID] = None
) -> List[ItemContributionResponse]:
    """
    The pledges on an item, filtered to what this viewer may see.

    Takes the item rather than a list of pledges so that the blind rule is
    applied here too and cannot be sidestepped by a route that queries
    item_contributions directly. A blind owner gets an empty list - the same
    response an item with no pledges gives.
    """
    return [
        serialize_contribution(c, viewer_user_id, viewer_guest_session_id)
        for c in _visible_contributions(item, viewer_user_id)
    ]
