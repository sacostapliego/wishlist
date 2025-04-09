from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from models.base import get_db
from models.item import WishListItem, WishListItemCreate, WishListItemUpdate, WishListItemResponse
from middleware.auth import get_current_user
from services.s3_service import upload_file_to_s3, delete_file_from_s3

router = APIRouter(prefix='/wishlist', tags=['wishlist'])

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
    items = db.query(WishListItem).filter(
        WishListItem.user_id == current_user["user_id"]
    ).offset(skip).limit(limit).all()
    return items

""" Get a single item """
@router.get('/{item_id}', response_model=WishListItemResponse)
def read_wishlist_item(
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
    
    return db_item


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
    items = db.query(WishListItem).filter(
        WishListItem.user_id == user_id
    ).offset(skip).limit(limit).all()
    
    return items