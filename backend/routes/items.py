from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from models.base import get_db
from models.item import WishListItem, WishListItemCreate, WishListItemUpdate, WishListItemResponse
from middleware.auth import get_current_user

router = APIRouter(prefix='/wishlist', tags=['wishlist'])

''' Create a new item '''
@router.post('/', response_model=WishListItemResponse)
def create_wishlist_item(
    item: WishListItemCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = WishListItem(
        user_id=current_user["user_id"],
        **item.model_dump()
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return db_item


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
def update_wishlist_item(
    item_id: uuid.UUID,
    item: WishListItemUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(WishListItem).filter(
        WishListItem.id == item_id,
        WishListItem.user_id == current_user["user_id"]
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail='Item not found')
    
    # Update the item with the provided values
    update_data = item.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
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