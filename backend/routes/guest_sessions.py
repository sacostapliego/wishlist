import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.base import get_db
from models.wishlist import Wishlist
from models.guest_session import GuestSessionCreate, GuestSessionResponse, GuestSessionMe
from services.guest_session import (
    create_guest_session,
    resolve_guest_session,
    get_guest_token,
)

router = APIRouter(prefix='/guest-session', tags=['guest-session'])

''' Start a guest session on a shared wishlist '''
@router.post('/', response_model=GuestSessionResponse)
def start_guest_session(
    payload: GuestSessionCreate,
    db: Session = Depends(get_db)
):
    """
    Lets someone take part without an account. They give a display name, and we
    hand back a token their browser keeps. The token is what authorises their
    later claims - it is returned here and never again.
    """
    display_name = payload.display_name.strip()
    if not display_name:
        raise HTTPException(status_code=400, detail='A display name is required')
    if len(display_name) > 80:
        raise HTTPException(status_code=400, detail='That name is too long')

    wishlist = db.query(Wishlist).filter(
        Wishlist.id == payload.wishlist_id,
        Wishlist.is_public == True
    ).first()

    if not wishlist:
        raise HTTPException(status_code=404, detail='Wishlist not found or not shared')

    session, raw_token = create_guest_session(
        db,
        wishlist_id=payload.wishlist_id,
        display_name=display_name,
        email=payload.email
    )

    return GuestSessionResponse(
        id=session.id,
        wishlist_id=session.wishlist_id,
        display_name=session.display_name,
        token=raw_token
    )

''' Check whether a stored guest token is still good '''
@router.get('/me', response_model=Optional[GuestSessionMe])
def get_my_guest_session(
    wishlist_id: uuid.UUID,
    guest_token: Optional[str] = Depends(get_guest_token),
    db: Session = Depends(get_db)
):
    """
    Returns null rather than 401 for an unknown token: the client just falls
    back to asking for a name again.
    """
    session = resolve_guest_session(db, guest_token, wishlist_id)
    if not session:
        return None

    return GuestSessionMe.model_validate(session)
