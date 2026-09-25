"""
The blind-mode rule, tested.

`serialize_item` is deliberately the only place an item becomes an API response,
because it is the only place the promise "the owner cannot see who is getting
them what" is kept. These tests exist so that promise cannot be broken quietly.

The assertion that matters most is `identically`: for the owner of a blind list,
an item with claims or pledges must serialize byte-for-byte the same as one
without. Not merely without a name attached - the same. An owner who can tell
*that* something happened has lost the surprise even without knowing who.

No database. The serializer reads plain attributes, so stubs are enough, and a
test that needs no connection is a test that actually gets run.
"""

import uuid
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from services.item_serializer import (
    serialize_item,
    serialize_contributions,
    BLIND,
    OPEN,
)

# Fixed so that two stub items differing only in claim state produce dicts that
# can be compared directly.
FIXED_TIME = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)
OWNER_ID = uuid.UUID('00000000-0000-0000-0000-0000000000a1')
ITEM_ID = uuid.UUID('00000000-0000-0000-0000-0000000000b1')
VISITOR_ID = uuid.UUID('00000000-0000-0000-0000-0000000000c1')
GUEST_ID = uuid.UUID('00000000-0000-0000-0000-0000000000d1')

def make_item(list_mode=BLIND, **overrides):
    """A wishlist item with nothing going on, ready to have state added."""
    fields = dict(
        id=ITEM_ID,
        user_id=OWNER_ID,
        wishlist_id=uuid.UUID('00000000-0000-0000-0000-0000000000e1'),
        wishlist=SimpleNamespace(visibility_mode=list_mode),
        name='Espresso machine',
        description=None,
        price=500.0,
        url=None,
        image=None,
        is_purchased=False,
        priority=0,
        created_at=FIXED_TIME,
        updated_at=None,
        claimed_by_user_id=None,
        claimed_by_user=None,
        claimed_by_guest_session_id=None,
        claimed_by_guest_session=None,
        claimed_by_name=None,
        claimed_at=None,
        claimed_under_mode=None,
        is_contribution=False,
        owner_seed_amount=None,
        contributions=[],
    )
    fields.update(overrides)
    return SimpleNamespace(**fields)

def claimed_by_member(list_mode, claimed_under_mode, **overrides):
    return make_item(
        list_mode=list_mode,
        claimed_by_user_id=VISITOR_ID,
        claimed_by_user=SimpleNamespace(name='Dana', username='dana'),
        claimed_at=FIXED_TIME,
        claimed_under_mode=claimed_under_mode,
        **overrides
    )

def pledge(amount, contributed_under_mode=OPEN, user_id=None, guest_session_id=None, note=None):
    return SimpleNamespace(
        id=uuid.uuid4(),
        amount=amount,
        note=note,
        created_at=FIXED_TIME,
        contributed_under_mode=contributed_under_mode,
        contributor_user_id=user_id,
        contributor_user=SimpleNamespace(name='Dana', username='dana') if user_id else None,
        guest_session_id=guest_session_id,
        guest_session=SimpleNamespace(display_name='Aunt May') if guest_session_id else None,
    )

def contribution_item(list_mode=BLIND, pledges=(), seed=None):
    return make_item(
        list_mode=list_mode,
        is_contribution=True,
        owner_seed_amount=seed,
        contributions=list(pledges),
    )

# ---------------------------------------------------------------- claims

def test_blind_owner_sees_a_claimed_item_exactly_as_an_unclaimed_one():
    """The whole point. If this fails, the surprise is gone."""
    unclaimed = serialize_item(make_item(BLIND), viewer_user_id=OWNER_ID)
    claimed = serialize_item(claimed_by_member(BLIND, BLIND), viewer_user_id=OWNER_ID)

    assert claimed.model_dump() == unclaimed.model_dump()

def test_blind_owner_sees_no_claim_fields():
    item = serialize_item(claimed_by_member(BLIND, BLIND), viewer_user_id=OWNER_ID)

    assert item.is_claimed is False
    assert item.claimed_by_display_name is None
    assert item.claimed_at is None
    assert item.claimed_by_viewer is False

def test_open_owner_sees_a_claim_made_while_open():
    item = serialize_item(claimed_by_member(OPEN, OPEN), viewer_user_id=OWNER_ID)

    assert item.is_claimed is True
    assert item.claimed_by_display_name == 'Dana'
    assert item.claimed_at == FIXED_TIME

def test_opening_a_list_does_not_reveal_claims_made_while_blind():
    """The retroactive-reveal rule: the claimer acted on a promise."""
    item = serialize_item(claimed_by_member(OPEN, BLIND), viewer_user_id=OWNER_ID)

    assert item.is_claimed is False
    assert item.claimed_by_display_name is None

def test_a_claim_from_before_the_column_existed_is_treated_as_blind():
    item = serialize_item(claimed_by_member(OPEN, None), viewer_user_id=OWNER_ID)

    assert item.is_claimed is False

def test_a_missing_wishlist_is_treated_as_blind():
    """A route that forgets to eager-load the relationship must not leak."""
    item = serialize_item(
        claimed_by_member(OPEN, OPEN, wishlist=None),
        viewer_user_id=OWNER_ID
    )

    assert item.is_claimed is False

@pytest.mark.parametrize('list_mode', [BLIND, OPEN])
def test_visitors_always_see_claims(list_mode):
    item = serialize_item(
        claimed_by_member(list_mode, list_mode),
        viewer_user_id=VISITOR_ID
    )

    assert item.is_claimed is True
    assert item.claimed_by_display_name == 'Dana'

def test_the_claimer_is_told_the_claim_is_theirs():
    item = serialize_item(claimed_by_member(BLIND, BLIND), viewer_user_id=VISITOR_ID)

    assert item.claimed_by_viewer is True

def test_a_guest_is_told_their_own_claim_is_theirs():
    item = make_item(
        BLIND,
        claimed_by_guest_session_id=GUEST_ID,
        claimed_by_guest_session=SimpleNamespace(display_name='Aunt May'),
        claimed_at=FIXED_TIME,
        claimed_under_mode=BLIND,
    )

    serialized = serialize_item(item, viewer_guest_session_id=GUEST_ID)

    assert serialized.claimed_by_display_name == 'Aunt May'
    assert serialized.claimed_by_viewer is True

# --------------------------------------------------------- contributions

def test_blind_owner_sees_a_funded_item_exactly_as_an_unfunded_one():
    """The claims rule, extended: no total, no count, nothing to draw a bar from."""
    pledges = [pledge(100.0, BLIND, user_id=VISITOR_ID) for _ in range(10)]

    empty = serialize_item(contribution_item(BLIND), viewer_user_id=OWNER_ID)
    funded = serialize_item(contribution_item(BLIND, pledges), viewer_user_id=OWNER_ID)

    assert funded.model_dump() == empty.model_dump()

def test_blind_owner_is_told_the_figures_are_withheld():
    """
    Safe to say, because it is true whether or not anyone has pledged - it says
    'you cannot see this', not 'there is something to see'.
    """
    item = serialize_item(contribution_item(BLIND), viewer_user_id=OWNER_ID)

    assert item.contributions_hidden is True
    assert item.contribution_total == 0.0
    assert item.contribution_count == 0

def test_blind_owner_still_sees_their_own_seed_amount():
    """They declared it themselves, so it cannot tell them anything new."""
    pledges = [pledge(250.0, BLIND, user_id=VISITOR_ID)]
    item = serialize_item(
        contribution_item(BLIND, pledges, seed=2000.0),
        viewer_user_id=OWNER_ID
    )

    assert item.contribution_total == 2000.0
    assert item.contribution_count == 0

def test_open_owner_sees_the_total_and_the_count():
    pledges = [
        pledge(100.0, OPEN, user_id=VISITOR_ID),
        pledge(50.0, OPEN, guest_session_id=GUEST_ID),
    ]
    item = serialize_item(
        contribution_item(OPEN, pledges, seed=200.0),
        viewer_user_id=OWNER_ID
    )

    assert item.contributions_hidden is False
    # seed is counted in the total but never in the count, which answers
    # 'how many other people have chipped in'
    assert item.contribution_total == 350.0
    assert item.contribution_count == 2

def test_opening_a_list_does_not_reveal_pledges_made_while_blind():
    pledges = [
        pledge(100.0, BLIND, user_id=VISITOR_ID),
        pledge(50.0, OPEN, guest_session_id=GUEST_ID),
    ]
    item = contribution_item(OPEN, pledges)

    for_owner = serialize_item(item, viewer_user_id=OWNER_ID)
    for_visitor = serialize_item(item, viewer_user_id=VISITOR_ID)

    assert for_owner.contribution_total == 50.0
    assert for_owner.contribution_count == 1
    # the visitor's figure is the real one; the owner's is what they may know
    assert for_visitor.contribution_total == 150.0
    assert for_visitor.contribution_count == 2

def test_visitors_see_every_pledge_even_on_a_blind_list():
    pledges = [pledge(100.0, BLIND, user_id=VISITOR_ID), pledge(25.0, BLIND, guest_session_id=GUEST_ID)]
    item = serialize_item(contribution_item(BLIND, pledges), viewer_user_id=VISITOR_ID)

    assert item.contribution_total == 125.0
    assert item.contribution_count == 2
    assert item.contributions_hidden is False

def test_a_non_contribution_item_carries_no_contribution_figures():
    item = serialize_item(make_item(OPEN), viewer_user_id=OWNER_ID)

    assert item.contribution_total is None
    assert item.contribution_count is None
    assert item.contributions_hidden is False

def test_the_pledge_list_is_empty_for_a_blind_owner():
    pledges = [pledge(100.0, BLIND, user_id=VISITOR_ID)]
    item = contribution_item(BLIND, pledges)

    assert serialize_contributions(item, viewer_user_id=OWNER_ID) == []

def test_the_pledge_list_names_contributors_for_a_visitor():
    pledges = [
        pledge(100.0, BLIND, user_id=VISITOR_ID, note='happy birthday'),
        pledge(25.0, BLIND, guest_session_id=GUEST_ID),
    ]
    item = contribution_item(BLIND, pledges)

    listed = serialize_contributions(item, viewer_user_id=VISITOR_ID)

    assert [c.contributor_display_name for c in listed] == ['Dana', 'Aunt May']
    assert [c.is_mine for c in listed] == [True, False]
    assert listed[0].note == 'happy birthday'

def test_a_guest_is_told_which_pledge_is_theirs():
    pledges = [pledge(25.0, BLIND, guest_session_id=GUEST_ID)]
    item = contribution_item(BLIND, pledges)

    listed = serialize_contributions(item, viewer_guest_session_id=GUEST_ID)

    assert listed[0].is_mine is True
    assert listed[0].contributor_display_name == 'Aunt May'
