import os
from fastapi import APIRouter, Depends, HTTPException, Form, Response, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy.orm import joinedload
from typing import List, Optional
import uuid

from models.user import User
from models.wishlist import Wishlist
from models.base import get_db
from models.item import ClaimRequest, WishListItem, WishListItemCreate, WishListItemUpdate, WishListItemResponse, ScrapeRequest
from middleware.auth import get_current_user
from services.s3_service import upload_file_to_s3, delete_file_from_s3, s3_client
from services.scraper import scrape_url

BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')

router = APIRouter(prefix='/wishlist', tags=['wishlist'])

''' Scrap item details from a URL '''
@router.post('/scrape-url', tags=['scraper'])
async def scrape_item_from_url(scrape_request: ScrapeRequest, current_user: dict = Depends(get_current_user)):
    scraped_data = scrape_url(str(scrape_request.url))
    if "error" in scraped_data:
        raise HTTPException(status_code=400, detail=scraped_data["error"])
    return scraped_data

''' Create a new item '''
@router.post('/', response_model=WishListItemResponse)
async def create_wishlist_item(
    # item
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    url: Optional[str] = Form(None),
    is_purchased: bool = Form(False),
    priority: int = Form(0),
    wishlist_id: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    # current_user/database session
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # process wishlist id
        wishlist_id = uuid.UUID(wishlist_id) if wishlist_id else None
        
        # handle image upload if provided
        image_url = None
        if image:
            image_url = await upload_file_to_s3(image, folder="wishlist_images")

        # create item
        item_data = {
            "name": name,
            "description": description,
            "price": price,
            "url": url,
            "is_purchased": is_purchased,
            "priority": priority,
            "wishlist_id": wishlist_id,
            "image": image_url
        }
        
        db_item = WishListItem(
            user_id=current_user["user_id"],
            **{k: v for k, v in item_data.items() if v is not None}
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
    
        return db_item
    except Exception as e:
        if 'image_url' in locals() and image_url:
            delete_file_from_s3(image_url)
        raise HTTPException(status_code=500, detail=f"Error creating item: {str(e)}")

''' Get all items '''
@router.get('/', response_model=List[WishListItemResponse])
def read_wishlist_items(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(WishListItem).options(
        joinedload(WishListItem.claimed_by_user)
    ).filter(
        WishListItem.user_id == current_user["user_id"]
    ).offset(skip).limit(limit).all()
    
    # Convert to response format with claimed_by_display_name
    response_items = []
    for item in items:
        item_dict = WishListItemResponse.model_validate(item).model_dump()
        
        if item.claimed_by_user_id and item.claimed_by_user:
            item_dict['claimed_by_display_name'] = item.claimed_by_user.name or item.claimed_by_user.username
        elif item.claimed_by_name:
            item_dict['claimed_by_display_name'] = item.claimed_by_name
        else:
            item_dict['claimed_by_display_name'] = None
            
        response_items.append(WishListItemResponse(**item_dict))
    
    return response_items

""" Get a single item """
@router.get('/{item_id}', response_model=WishListItemResponse)
def read_wishlist_item(
    item_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(WishListItem).options(
        joinedload(WishListItem.claimed_by_user)
    ).filter(
        WishListItem.id == item_id, 
        WishListItem.user_id == current_user["user_id"]
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail='Item not found')
    
    # Convert to response format with claimed_by_display_name
    item_dict = WishListItemResponse.model_validate(db_item).model_dump()
    
    if db_item.claimed_by_user_id and db_item.claimed_by_user:
        item_dict['claimed_by_display_name'] = db_item.claimed_by_user.name or db_item.claimed_by_user.username
    elif db_item.claimed_by_name:
        item_dict['claimed_by_display_name'] = db_item.claimed_by_name
    else:
        item_dict['claimed_by_display_name'] = None
        
    return WishListItemResponse(**item_dict)

''' Update an item '''
@router.put('/{item_id}', response_model=WishListItemResponse)
async def update_wishlist_item(
    item_id: uuid.UUID,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    url: Optional[str] = Form(None),
    is_purchased: Optional[bool] = Form(None),
    priority: Optional[int] = Form(None),
    wishlist_id: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(WishListItem).filter(
        WishListItem.id == item_id,
        WishListItem.user_id == current_user["user_id"]
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail='Item not found')
    
    # Process wishlist_id
    wishlist_uuid = None
    if wishlist_id:
        try:
            wishlist_uuid = uuid.UUID(wishlist_id)
        except ValueError:
            raise HTTPException(status_code=400, detail='Invalid wishlist ID format')
    
    # Handle image update if provided
    if image:
        # Delete old image if it exists
        if db_item.image:
            delete_file_from_s3(db_item.image)
        
        # Upload new image
        new_image_url = await upload_file_to_s3(image)
        db_item.image = new_image_url
    
    # Update other fields if provided
    if name is not None:
        db_item.name = name
    if description is not None:
        db_item.description = description
    if price is not None:
        db_item.price = price
    if url is not None:
        db_item.url = url
    if is_purchased is not None:
        db_item.is_purchased = is_purchased
    if priority is not None:
        db_item.priority = priority
    if wishlist_uuid is not None:
        db_item.wishlist_id = wishlist_uuid
    
    db.commit()
    db.refresh(db_item)
    return db_item

''' Delete an item '''
@router.delete('/{item_id}', response_model=dict)
def delete_wishlist_item(
    item_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(WishListItem).filter(
        WishListItem.id == item_id,
        WishListItem.user_id == current_user["user_id"]
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail='Item not found')
    
    # Delete image from S3 if it exists
    if db_item.image:
        delete_file_from_s3(db_item.image)
    
    db.delete(db_item)
    db.commit()
    return {'detail': 'Item deleted successfully'}


""" Get another user's wishlist """
@router.get('/user/{user_id}', response_model=List[WishListItemResponse])
def read_user_wishlist(
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    items = db.query(WishListItem).options(
        joinedload(WishListItem.claimed_by_user)
    ).filter(
        WishListItem.user_id == user_id
    ).offset(skip).limit(limit).all()
    
    # Convert to response format with claimed_by_display_name
    response_items = []
    for item in items:
        item_dict = WishListItemResponse.model_validate(item).model_dump()
        
        if item.claimed_by_user_id and item.claimed_by_user:
            item_dict['claimed_by_display_name'] = item.claimed_by_user.name or item.claimed_by_user.username
        elif item.claimed_by_name:
            item_dict['claimed_by_display_name'] = item.claimed_by_name
        else:
            item_dict['claimed_by_display_name'] = None
            
        response_items.append(WishListItemResponse(**item_dict))
    
    return response_items


"""Get an item's image directly from S3"""
@router.get('/{item_id}/image', response_class=Response)
async def get_item_image(
    item_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Get an item's image directly from S3"""
    item = db.query(WishListItem).filter(WishListItem.id == item_id).first()
    if not item or not item.image:
        raise HTTPException(status_code=404, detail="Item image not found")
    
    try:
        # Extract the key from the URL
        # Format: https://bucket-name.s3.amazonaws.com/wishlist_images/image-id.jpg
        s3_key = item.image.split(f"https://{BUCKET_NAME}.s3.amazonaws.com/")[1]
        
        # Get the object from S3
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        image_data = response['Body'].read()
        
        # Return the image with proper content type
        content_type = response.get('ContentType', 'image/jpeg')
        return Response(content=image_data, media_type=content_type)
        
    except Exception as e:
        print(f"Error retrieving item image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve item image")
    
    
""" Get items from a public wishlist without authentication """
@router.get('/public/{wishlist_id}', response_model=List[WishListItemResponse])
def read_public_wishlist_items(
    wishlist_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Get items from a public wishlist without authentication"""
    # First verify this is a public wishlist
    db_wishlist = db.query(Wishlist).filter(
        Wishlist.id == wishlist_id,
        Wishlist.is_public == True
    ).first()
    
    if not db_wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found or not public")
    
    # Get items for this wishlist with user information
    items = db.query(WishListItem).options(
        joinedload(WishListItem.claimed_by_user)
    ).filter(
        WishListItem.wishlist_id == wishlist_id
    ).all()
    
    # Convert to response format with claimed_by_display_name
    response_items = []
    for item in items:
        item_dict = WishListItemResponse.model_validate(item).model_dump()
        
        # Add display name for claimed items
        if item.claimed_by_user_id and item.claimed_by_user:
            item_dict['claimed_by_display_name'] = item.claimed_by_user.name or item.claimed_by_user.username
        elif item.claimed_by_name:
            item_dict['claimed_by_display_name'] = item.claimed_by_name
        else:
            item_dict['claimed_by_display_name'] = None
            
        response_items.append(WishListItemResponse(**item_dict))
    
    return response_items


""" Claim an item for purchase """
@router.post('/{item_id}/claim')
def claim_item(
    item_id: uuid.UUID,
    claim_data: ClaimRequest,
    db: Session = Depends(get_db)
):
    # Get the item
    item = db.query(WishListItem).filter(WishListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if already claimed
    if item.claimed_by_user_id or item.claimed_by_name:
        raise HTTPException(status_code=400, detail="Item is already claimed")
    
    # Claim the item - ONLY set one field, not both
    if claim_data.user_id:
        # For registered users, only set the user_id
        item.claimed_by_user_id = claim_data.user_id
        item.claimed_by_name = None  # Explicitly set to None
    elif claim_data.guest_name:
        # For guests, only set the name
        item.claimed_by_name = claim_data.guest_name
        item.claimed_by_user_id = None  # Explicitly set to None
    else:
        raise HTTPException(status_code=400, detail="Either user_id or guest_name is required")
    
    item.claimed_at = func.now()
    
    db.commit()
    db.refresh(item)
    
    return {"message": "Item claimed successfully"}

""" Unclaim an item """
@router.delete('/{item_id}/claim')
def unclaim_item(
    item_id: uuid.UUID,
    unclaim_data: ClaimRequest,
    db: Session = Depends(get_db)
):
    # Get the item
    item = db.query(WishListItem).filter(WishListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if the requester can unclaim
    can_unclaim = False
    if unclaim_data.user_id and str(item.claimed_by_user_id) == unclaim_data.user_id:
        can_unclaim = True
    elif unclaim_data.guest_name and item.claimed_by_name == unclaim_data.guest_name:
        can_unclaim = True
    
    if not can_unclaim:
        raise HTTPException(status_code=403, detail="You cannot unclaim this item")
    
    # Unclaim the item
    item.claimed_by_user_id = None
    item.claimed_by_name = None
    item.claimed_at = None
    
    db.commit()
    db.refresh(item)
    
    return {"message": "Item unclaimed successfully"}