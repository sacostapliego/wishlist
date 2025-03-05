from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.base import get_db
from models.item import WishListItem, WishListItemCreate, WishListItemUpdate, WishListItemReponse

router = APIRouter(prefix='/wishlist', tags=['wishlist'])

''' Create a new item '''
@router.post('/', response_model=WishListItemReponse)
def create_wishlist_item(
    item: WishListItemCreate,
    db: Session = Depends(get_db)
):
    db_item = WishListItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


''' Get all items '''
@router.get('/', response_model=WishListItemReponse)
def read_wishlist_items(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    items = db.query(WishListItem).offset(skip).limit(limit).all()
    return items


''' Update an item '''
@router.put('/{item_id}', response_model=WishListItemReponse)
def update_wishlist_item(
    item_id: int,
    item: WishListItemUpdate,
    db: Session = Depends(get_db)
):
    db_item = db.query(WishListItem).filter(WishListItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail='Item not found')
    
    for key, value in item.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

''' Delete an item '''
@router.delete('/{item_id}', response_model=dict)
def delete_wihstlist_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    db_item = db.query(WishListItem).filter(WishListItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail='Item not found')
    
    db.delete(db_item)
    db.commit()
    return {'detail': 'Item deleted successfully'}