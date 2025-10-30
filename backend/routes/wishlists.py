from html import escape
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import uuid

from services.s3_service import delete_file_from_s3
from models.base import get_db
from models.wishlist import Wishlist, WishlistCreate, WishlistUpdate, WishlistResponse
from models.item import WishListItem
from middleware.auth import get_current_user
from models.user import User

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
    
    # Delete associated images from S3
    for item in db_wishlist.items:
        if item.image:
            delete_file_from_s3(item.image)
    
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

@router.get('/shared/{wishlist_id}', response_class=HTMLResponse)
def get_shared_wishlist_meta_page(
    wishlist_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Serve HTML with Open Graph meta tags for shared wishlists"""
    db_wishlist = db.query(Wishlist).filter(
        Wishlist.id == wishlist_id,
        Wishlist.is_public == True
    ).first()
    
    if not db_wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    
    # Owner
    owner = db.query(User).filter(User.id == db_wishlist.user_id).first()
    owner_name = (owner.name or owner.username) if owner else "User"

    # Bases (configure via env)
    frontend_base = (os.getenv('PUBLIC_FRONTEND_URL', 'https://cardinal-wishlist.onrender.com') or '').rstrip('/')
    api_base = (os.getenv('PUBLIC_API_URL', 'https://cardinal-wishlist-api.onrender.com') or '').rstrip('/')

    def is_absolute(url: str) -> bool:
        return url.startswith('http://') or url.startswith('https://')

    # Frontend URL that users land on
    frontend_url = f"{frontend_base}/shared/{wishlist_id}"

    # OG image:
    # 1) If wishlist.image is an absolute URL, use it
    # 2) Else if owner exists and has a pfp, use the public API proxy: /users/{id}/profile-image
    # 3) Else fallback to frontend favicon
    og_image = f"{frontend_base}/favicon.ico"
    if db_wishlist.image and is_absolute(db_wishlist.image):
        og_image = db_wishlist.image
    elif owner and owner.pfp:
        og_image = f"{api_base}/users/{owner.id}/profile-image"

    title = db_wishlist.title or "Shared Wishlist"
    description = (db_wishlist.description or f"{owner_name}'s wishlist") or ""

    # Escape to keep HTML safe
    safe_title = escape(title)
    safe_description = escape(description)
    safe_frontend_url = escape(frontend_url)
    safe_og_image = escape(og_image)

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{safe_title}</title>
        <meta name="description" content="{safe_description}">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{safe_frontend_url}">
        <meta property="og:title" content="{safe_title}">
        <meta property="og:description" content="{safe_description}">
        <meta property="og:image" content="{safe_og_image}">
        
        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="{safe_frontend_url}">
        <meta name="twitter:title" content="{safe_title}">
        <meta name="twitter:description" content="{safe_description}">
        <meta name="twitter:image" content="{safe_og_image}">
        
        <!-- Redirect to frontend after meta tags are read -->
        <meta http-equiv="refresh" content="0;url={safe_frontend_url}">
    </head>
    <body>
        <p>Redirecting...</p>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)