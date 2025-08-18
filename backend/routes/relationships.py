from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models.base import get_db
from models.user_relationship import UserRelationship, RelationshipStatus
from models.user import User
from models.wishlist import Wishlist
from middleware.auth import get_current_user

from pydantic import BaseModel
from typing import List
import uuid

router = APIRouter(prefix="/friends", tags=["friends"])

class FriendRequestCreate(BaseModel):
    friendId: str

class FriendRequestResponse(BaseModel):
    status: str

class UserSearchResponse(BaseModel):
    id: str
    username: str
    name: str = None

class FriendRequestInfo(BaseModel):
    id: str
    user_id: str
    username: str
    name: str = None
    created_at: str

class FriendWishlistResponse(BaseModel):
    id: str
    title: str
    description: str = None
    color: str = None
    item_count: int = 0
    owner_id: str
    owner_name: str
    owner_username: str
    image: str | None = None
    
class FriendInfo(BaseModel):
    id: str
    username: str
    name: str | None = None

@router.get("/search")
def search_users(
    username: str = Query(..., min_length=2, description="Username to search for"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for users by username"""
    # Search for users excluding current user
    user = db.query(User).filter(
        User.username.ilike(f"%{username}%"),
        User.id != current_user["user_id"]
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserSearchResponse(
        id=str(user.id),
        username=user.username,
        name=user.name
    )

@router.post("/request")
def send_friend_request(
    request: FriendRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a friend request"""
    friend_id = uuid.UUID(request.friendId)
    user_id = current_user["user_id"]
    
    # Check if user exists
    friend = db.query(User).filter(User.id == friend_id).first()
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if they're trying to add themselves
    if friend_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
    # Check if relationship already exists
    existing = db.query(UserRelationship).filter(
        or_(
            (UserRelationship.user_id == user_id) & (UserRelationship.friend_id == friend_id),
            (UserRelationship.user_id == friend_id) & (UserRelationship.friend_id == user_id)
        )
    ).first()
    
    if existing:
        if existing.status == RelationshipStatus.ACCEPTED:
            raise HTTPException(status_code=400, detail="Already friends")
        elif existing.status == RelationshipStatus.PENDING:
            raise HTTPException(status_code=400, detail="Friend request already sent")
    
    # Create friend request
    relationship = UserRelationship(
        user_id=user_id,
        friend_id=friend_id,
        status=RelationshipStatus.PENDING
    )
    
    db.add(relationship)
    db.commit()
    
    return {"message": "Friend request sent successfully"}

@router.get("/requests")
def get_friend_requests(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pending friend requests for current user"""
    user_id = current_user["user_id"]
    
    # Get pending requests where current user is the friend (receiver)
    requests = db.query(UserRelationship, User).join(
        User, UserRelationship.user_id == User.id
    ).filter(
        UserRelationship.friend_id == user_id,
        UserRelationship.status == RelationshipStatus.PENDING
    ).all()
    
    result = []
    for relationship, user in requests:
        result.append(FriendRequestInfo(
            id=str(relationship.id),
            user_id=str(user.id),
            username=user.username,
            name=user.name,
            created_at=relationship.created_at.isoformat()
        ))
    
    return result

@router.post("/requests/{request_id}/accept")
def accept_friend_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a friend request"""
    user_id = current_user["user_id"]
    
    # Find the request
    relationship = db.query(UserRelationship).filter(
        UserRelationship.id == uuid.UUID(request_id),
        UserRelationship.friend_id == user_id,
        UserRelationship.status == RelationshipStatus.PENDING
    ).first()
    
    if not relationship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Update status to accepted
    relationship.status = RelationshipStatus.ACCEPTED
    db.commit()
    
    return {"message": "Friend request accepted"}

@router.post("/requests/{request_id}/decline")
def decline_friend_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Decline a friend request"""
    user_id = current_user["user_id"]
    
    # Find the request
    relationship = db.query(UserRelationship).filter(
        UserRelationship.id == uuid.UUID(request_id),
        UserRelationship.friend_id == user_id,
        UserRelationship.status == RelationshipStatus.PENDING
    ).first()
    
    if not relationship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Delete the relationship
    db.delete(relationship)
    db.commit()
    
    return {"message": "Friend request declined"}

@router.get("/wishlists")
def get_friends_wishlists(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get public wishlists from friends"""
    # Normalize to UUID to compare correctly with DB UUIDs
    user_id = uuid.UUID(str(current_user["user_id"]))
    
    # Get accepted friendships
    friendships = db.query(UserRelationship).filter(
        or_(
            (UserRelationship.user_id == user_id),
            (UserRelationship.friend_id == user_id)
        ),
        UserRelationship.status == RelationshipStatus.ACCEPTED
    ).all()
    
    friend_ids: set[uuid.UUID] = set()
    for fr in friendships:
        # Always pick "the other" user
        other_id = fr.friend_id if fr.user_id == user_id else fr.user_id
        # Guard against self being added accidentally
        if other_id != user_id:
            friend_ids.add(other_id)
    
    if not friend_ids:
        return []
    
    # Get public wishlists from friends
    wishlists = db.query(Wishlist, User).join(
        User, Wishlist.user_id == User.id
    ).filter(
        Wishlist.user_id.in_(list(friend_ids)),
        Wishlist.is_public == True
    ).all()
    
    result = []
    for wishlist, user in wishlists:
        from models.item import WishListItem
        item_count = db.query(WishListItem).filter(
            WishListItem.wishlist_id == wishlist.id
        ).count()
        
        result.append(FriendWishlistResponse(
            id=str(wishlist.id),
            title=wishlist.title,
            description=wishlist.description,
            color=wishlist.color,
            item_count=item_count,
            owner_id=str(user.id),
            owner_name=user.name or user.username,
            owner_username=user.username,
            image=wishlist.image
        ))
    
    return result

@router.get("/list")
def get_friends_list(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get accepted friends (both directions)"""
    # Normalize to UUID
    user_id = uuid.UUID(str(current_user["user_id"]))

    friendships = db.query(UserRelationship).filter(
        or_(
            (UserRelationship.user_id == user_id),
            (UserRelationship.friend_id == user_id)
        ),
        UserRelationship.status == RelationshipStatus.ACCEPTED
    ).all()

    friend_ids: set[uuid.UUID] = set()
    for fr in friendships:
        other_id = fr.friend_id if fr.user_id == user_id else fr.user_id
        if other_id != user_id:
            friend_ids.add(other_id)

    if not friend_ids:
        return []

    friends = db.query(User).filter(User.id.in_(list(friend_ids))).all()
    return [FriendInfo(id=str(u.id), username=u.username, name=u.name) for u in friends]