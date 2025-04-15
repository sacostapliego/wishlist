from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import uuid

from models.base import get_db
from models.wishlist import Wishlist, WishlistCreate, WishlistUpdate, WishlistResponse
from models.item import WishListItem
from middleware.auth import get_current_user

router = APIRouter(prefix='/wishlists', tags=['wishlists'])

@router.post('/', response_model=WishlistResponse)
def create_wishlist(
    wishlist: WishlistCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new wishlist"""
    db_wishlist = Wishlist(
        user_id=current_user["user_id"],
        **wishlist.model_dump()
    )
    db.add(db_wishlist)
    db.commit()
    db.refresh(db_wishlist)
    
    # Count items (will be 0 for new wishlist)
    item_count = db.query(func.count(WishListItem.id)).filter(
        WishListItem.wishlist_id == db_wishlist.id
    ).scalar() or 0
    
    # Create response with item count
    response_data = db_wishlist.__dict__.copy()
    response_data['item_count'] = item_count
    
    return response_data

@router.get('/', response_model=List[WishlistResponse])
def get_wishlists(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all wishlists for the current user"""
    wishlists = db.query(Wishlist).filter(
        Wishlist.user_id == current_user["user_id"]
    ).offset(skip).limit(limit).all()
    
    # Add item counts to each wishlist
    result = []
    for wishlist in wishlists:
        item_count = db.query(func.count(WishListItem.id)).filter(
            WishListItem.wishlist_id == wishlist.id
        ).scalar() or 0
        
        wishlist_dict = wishlist.__dict__.copy()
        wishlist_dict['item_count'] = item_count
        result.append(wishlist_dict)
    
    return result

@router.get('/{wishlist_id}', response_model=WishlistResponse)
def get_wishlist(
    wishlist_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific wishlist by ID"""
    db_wishlist = db.query(Wishlist).filter(
        Wishlist.id == wishlist_id,
        Wishlist.user_id == current_user["user_id"]
    ).first()
    
    if not db_wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    
    # Count items
    item_count = db.query(func.count(WishListItem.id)).filter(
        WishListItem.wishlist_id == db_wishlist.id
    ).scalar() or 0
    
    # Create response with item count
    response_data = db_wishlist.__dict__.copy()
    response_data['item_count'] = item_count
    
    return response_data

@router.put('/{wishlist_id}', response_model=WishlistResponse)
def update_wishlist(
    wishlist_id: uuid.UUID,
    wishlist: WishlistUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a wishlist"""
    db_wishlist = db.query(Wishlist).filter(
        Wishlist.id == wishlist_id,
        Wishlist.user_id == current_user["user_id"]
    ).first()
    
    if not db_wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    
    # Update the wishlist with the provided values
    update_data = wishlist.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_wishlist, key, value)
    
    db.commit()
    db.refresh(db_wishlist)
    
    # Count items
    item_count = db.query(func.count(WishListItem.id)).filter(
        WishListItem.wishlist_id == db_wishlist.id
    ).scalar() or 0
    
    # Create response with item count
    response_data = db_wishlist.__dict__.copy()
    response_data['item_count'] = item_count
    
    return response_data

@router.delete('/{wishlist_id}', response_model=dict)
def delete_wishlist(
    wishlist_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a wishlist"""
    db_wishlist = db.query(Wishlist).filter(
        Wishlist.id == wishlist_id,
        Wishlist.user_id == current_user["user_id"]
    ).first()
    
    if not db_wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    
    db.delete(db_wishlist)
    db.commit()
    
    return {"message": "Wishlist deleted successfully"}

@router.get('/user/{user_id}', response_model=List[WishlistResponse])
def get_user_wishlists(
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get public wishlists for a specific user (for friends view)"""
    wishlists = db.query(Wishlist).filter(
        Wishlist.user_id == user_id,
        Wishlist.is_public == True
    ).offset(skip).limit(limit).all()
    
    # Add item counts to each wishlist
    result = []
    for wishlist in wishlists:
        item_count = db.query(func.count(WishListItem.id)).filter(
            WishListItem.wishlist_id == wishlist.id
        ).scalar() or 0
        
        wishlist_dict = wishlist.__dict__.copy()
        wishlist_dict['item_count'] = item_count
        result.append(wishlist_dict)
    
    return result

# Public wishlist endpoint
@router.get('/public/{wishlist_id}', response_model=WishlistResponse)
def get_public_wishlist(
    wishlist_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Get a public wishlist without authentication"""
    db_wishlist = db.query(Wishlist).filter(
        Wishlist.id == wishlist_id,
        Wishlist.is_public == True  # Only allow access to public wishlists
    ).first()
    
    if not db_wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    
    # Count items
    item_count = db.query(func.count(WishListItem.id)).filter(
        WishListItem.wishlist_id == db_wishlist.id
    ).scalar() or 0
    
    # Create response with item count
    response_data = db_wishlist.__dict__.copy()
    response_data['item_count'] = item_count
    
    return response_data