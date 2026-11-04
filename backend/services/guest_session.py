import hashlib
import secrets
import uuid
from typing import Optional, Tuple

from fastapi import Header, HTTPException
from sqlalchemy import exists
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from models.guest_session import GuestSession
from models.item import WishListItem
from models.item_contribution import ItemContribution

# A wishlist is shared with family, not the internet at large. This cap keeps an
# unauthenticated endpoint from being used to write unbounded rows. Reaching it
# evicts the longest-idle session rather than refusing; see create_guest_session.
MAX_SESSIONS_PER_WISHLIST = 500

def _hash_token(raw_token: str) -> str:
    """Tokens are high-entropy random strings, so a plain SHA-256 is enough."""
    return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

def create_guest_session(
    db: Session,
    wishlist_id: uuid.UUID,
    display_name: str,
    email: Optional[str] = None
) -> Tuple[GuestSession, str]:
    """Create a session and return it alongside the raw token (shown once)."""
    existing_count = db.query(GuestSession).filter(
        GuestSession.wishlist_id == wishlist_id
    ).count()

    if existing_count >= MAX_SESSIONS_PER_WISHLIST:
        # A full list makes room rather than turning guests away, or anyone could
        # fill it with throwaway sessions and lock the real guests out. Only a
        # session that has neither claimed nor pledged is given up; its guest
        # just enters their name again next time.
        idle = db.query(GuestSession).filter(
            GuestSession.wishlist_id == wishlist_id,
            ~exists().where(WishListItem.claimed_by_guest_session_id == GuestSession.id),
            ~exists().where(ItemContribution.guest_session_id == GuestSession.id)
        ).order_by(GuestSession.last_seen_at.asc()).first()

        if idle is None:
            raise HTTPException(
                status_code=429,
                detail='This wishlist has reached its guest limit'
            )
        db.delete(idle)

    raw_token = secrets.token_urlsafe(32)

    session = GuestSession(
        wishlist_id=wishlist_id,
        display_name=display_name.strip(),
        email=email,
        token_hash=_hash_token(raw_token),
        last_seen_at=func.now()
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session, raw_token

def resolve_guest_session(
    db: Session,
    raw_token: Optional[str],
    wishlist_id: Optional[uuid.UUID] = None
) -> Optional[GuestSession]:
    """
    Look up the session a token belongs to. Returns None rather than raising so
    callers can fall through to 'anonymous viewer' instead of erroring out.
    """
    if not raw_token:
        return None

    session = db.query(GuestSession).filter(
        GuestSession.token_hash == _hash_token(raw_token)
    ).first()

    if not session:
        return None

    # A token minted for one wishlist must not act on another.
    if wishlist_id is not None and session.wishlist_id != wishlist_id:
        return None

    session.last_seen_at = func.now()
    db.commit()

    return session

async def get_guest_token(x_guest_token: Optional[str] = Header(None)) -> Optional[str]:
    """FastAPI dependency: pulls the raw token off the X-Guest-Token header."""
    return x_guest_token
