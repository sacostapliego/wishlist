from fastapi import HTTPException, Depends, Header
from sqlalchemy.orm import Session
import hashlib
import hmac
import jwt
import os
from dotenv import load_dotenv
from typing import Optional
import uuid

from models.base import get_db
from models.user import User

# Load environment variables
load_dotenv()

# JWT
JWT_SECRET = os.getenv('JWT_SECRET')

def session_stamp(user: User) -> str:
    """
    Derived from the user's current password hash and stored in their token.
    Changing the password changes the stamp, which signs the user out everywhere
    without a sessions table, and tokens issued before the stamp existed carry
    none and are rejected.
    """
    return hmac.new(
        JWT_SECRET.encode('utf-8'),
        user.password.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

# Get current user from JWT token
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail='No token provided')
    try:
        # Extract token
        token = authorization.replace("Bearer ", "")

        # Decode token
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = uuid.UUID(payload.get('sub'))
    except (jwt.PyJWTError, TypeError, ValueError) as e:
        print(f"JWT Error: {e}")
        raise HTTPException(status_code=401, detail='Invalid token')

    # A valid signature is not enough: the account has to still exist, still be
    # active, and still have the password this token was issued under.
    user = db.query(User).filter(User.id == user_id).first()
    if (
        user is None
        or not user.is_active
        or not hmac.compare_digest(str(payload.get('sid', '')), session_stamp(user))
    ):
        raise HTTPException(status_code=401, detail='Invalid token')

    # Return as string
    return {"user_id": str(user_id)}

# Same as get_current_user, but returns None instead of raising when the caller
# is not signed in. Used by endpoints that serve both members and guests.
def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        return None
    try:
        return get_current_user(authorization, db)
    except HTTPException:
        return None
