import os
import uuid
import io
import base64
from fastapi import APIRouter, Depends, HTTPException, Form, Response, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy.orm import joinedload
from typing import List, Optional
from PIL import Image


from models.wishlist import Wishlist
from models.base import get_db
from models.item import WishListItem, WishListItemCreate, WishListItemUpdate, WishListItemResponse, ScrapeRequest
from middleware.auth import get_current_user, get_current_user_optional
from services.guest_session import get_guest_token, resolve_guest_session
from services.item_serializer import serialize_item, serialize_items
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

@router.post('/process-image/remove-background', tags=['image-processing'])
async def process_image_remove_background(image: UploadFile = File(...)):
    """
    Receives an image, removes the white background, and returns the new image as a base64 string.
    """
    try:
        image_data = await image.read()
        
        # Use the existing helper to process the image
        processed_image_data = _remove_white_background(image_data)
        
        # Encode the result as a base64 data URL to send back to the client
        base64_encoded_image = base64.b64encode(processed_image_data).decode('utf-8')
        data_url = f"data:image/png;base64,{base64_encoded_image}"
        
        return {"image_data_url": data_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

""" Helper function to remove white background """
def _remove_white_background(image_data: bytes) -> bytes:
    """Processes image data with Pillow to remove white background."""
    img = Image.open(io.BytesIO(image_data)).convert("RGBA")
    datas = img.getdata()
    newData = []
    # Tolerance for "off-white" colors
    tolerance = 20 
    for item_pixel in datas:
        if item_pixel[0] > 255 - tolerance and item_pixel[1] > 255 - tolerance and item_pixel[2] > 255 - tolerance:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item_pixel)
    img.putdata(newData)
    buffer = io.BytesIO()
    img.save(buffer, "PNG")
    buffer.seek(0)
    return buffer.getvalue()

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
    
        return serialize_item(db_item, viewer_user_id=uuid.UUID(current_user["user_id"]))
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
        joinedload(WishListItem.claimed_by_user),
        joinedload(WishListItem.claimed_by_guest_session)
    ).filter(
        WishListItem.user_id == current_user["user_id"]
    ).offset(skip).limit(limit).all()
    
    return serialize_items(items, viewer_user_id=uuid.UUID(current_user["user_id"]))

''' Get items by wishlist '''
@router.get('/items/{wishlist_id}', response_model=List[WishListItemResponse])
def get_items_by_wishlist(
    wishlist_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all items in a specific wishlist owned by the current user"""
    # Verify the wishlist belongs to the current user
    db_wishlist = db.query(Wishlist).filter(
        Wishlist.id == wishlist_id,
        Wishlist.user_id == current_user["user_id"]
    ).first()
    
    if not db_wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    
    items = db.query(WishListItem).options(
        joinedload(WishListItem.claimed_by_user),
        joinedload(WishListItem.claimed_by_guest_session)
    ).filter(
        WishListItem.wishlist_id == wishlist_id
    ).all()
    
    return serialize_items(items, viewer_user_id=uuid.UUID(current_user["user_id"]))

""" Get a single item """
@router.get('/{item_id}', response_model=WishListItemResponse)
def read_wishlist_item(
    item_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(WishListItem).options(
        joinedload(WishListItem.claimed_by_user),
        joinedload(WishListItem.claimed_by_guest_session)
    ).filter(
        WishListItem.id == item_id, 
        WishListItem.user_id == current_user["user_id"]
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail='Item not found')
    
    return serialize_item(db_item, viewer_user_id=uuid.UUID(current_user["user_id"]))

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
    return serialize_item(db_item, viewer_user_id=uuid.UUID(current_user["user_id"]))

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
    current_user: Optional[dict] = Depends(get_current_user_optional),
    guest_token: Optional[str] = Depends(get_guest_token),
    db: Session = Depends(get_db)
):
    viewer_user_id = uuid.UUID(current_user["user_id"]) if current_user else None
    guest_session = resolve_guest_session(db, guest_token)
    viewer_guest_session_id = guest_session.id if guest_session else None

    items = db.query(WishListItem).options(
        joinedload(WishListItem.claimed_by_user),
        joinedload(WishListItem.claimed_by_guest_session)
    ).filter(
        WishListItem.user_id == user_id
    ).offset(skip).limit(limit).all()
    
    return serialize_items(
        items,
        viewer_user_id=viewer_user_id,
        viewer_guest_session_id=viewer_guest_session_id
    )

""" Remove white background from an item's image """
@router.post('/{item_id}/remove-background', response_model=dict)
async def remove_item_image_background(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Removes the white background from an item's image and saves it back to S3.
    """
    item = db.query(WishListItem).filter(WishListItem.id == item_id).first()
    if not item or not item.image:
        raise HTTPException(status_code=404, detail="Item or item image not found")
    
    wishlist = db.query(Wishlist).filter(Wishlist.id == item.wishlist_id).first()
    if not wishlist or wishlist.owner_id != uuid.UUID(current_user['id']):
        raise HTTPException(status_code=403, detail="Not authorized to modify this item")

    try:
        # 1. Download image from S3
        s3_key = item.image.split(f"https://{BUCKET_NAME}.s3.amazonaws.com/")[1]
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        image_data = response['Body'].read()
        
        # 2. Process with Pillow
        img = Image.open(io.BytesIO(image_data)).convert("RGBA")
        datas = img.getdata()

        newData = []
        # Set a tolerance for "off-white" colors
        tolerance = 20 
        for item_pixel in datas:
            # If the pixel is close to white, make it transparent
            if item_pixel[0] > 255 - tolerance and item_pixel[1] > 255 - tolerance and item_pixel[2] > 255 - tolerance:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item_pixel)
        
        img.putdata(newData)

        # 3. Save processed image to a buffer
        buffer = io.BytesIO()
        img.save(buffer, "PNG")
        buffer.seek(0)

        # 4. Upload the new transparent image back to S3, overwriting the old one
        # The s3_key should point to the same object to overwrite it.
        # Ensure the content type is 'image/png' for transparency.
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=buffer,
            ContentType='image/png',
            ACL='public-read' # Or your default ACL
        )
        
        # The URL remains the same, so no DB update is needed.
        
        return {"message": "Background removed successfully."}

    except Exception as e:
        print(f"Error removing background: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove image background.")

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
    current_user: Optional[dict] = Depends(get_current_user_optional),
    guest_token: Optional[str] = Depends(get_guest_token),
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
    
    viewer_user_id = uuid.UUID(current_user["user_id"]) if current_user else None
    guest_session = resolve_guest_session(db, guest_token, wishlist_id)
    viewer_guest_session_id = guest_session.id if guest_session else None
    
    # Get items for this wishlist with user information
    items = db.query(WishListItem).options(
        joinedload(WishListItem.claimed_by_user),
        joinedload(WishListItem.claimed_by_guest_session)
    ).filter(
        WishListItem.wishlist_id == wishlist_id
    ).all()
    
    return serialize_items(
        items,
        viewer_user_id=viewer_user_id,
        viewer_guest_session_id=viewer_guest_session_id
    )

""" Claim an item for purchase """
@router.post('/{item_id}/claim')
def claim_item(
    item_id: uuid.UUID,
    current_user: Optional[dict] = Depends(get_current_user_optional),
    guest_token: Optional[str] = Depends(get_guest_token),
    db: Session = Depends(get_db)
):
    """
    Identity comes from the JWT or the X-Guest-Token header, never from the
    request body - a caller cannot claim on someone else's behalf.
    """
    item = db.query(WishListItem).filter(WishListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Only items on a shared wishlist can be claimed; knowing an item id is not
    # permission to touch it.
    wishlist = db.query(Wishlist).filter(
        Wishlist.id == item.wishlist_id,
        Wishlist.is_public == True
    ).first()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Item is not on a shared wishlist")

    if item.claimed_by_user_id or item.claimed_by_guest_session_id or item.claimed_by_name:
        raise HTTPException(status_code=400, detail="Item is already claimed")

    if current_user:
        item.claimed_by_user_id = uuid.UUID(current_user["user_id"])
        item.claimed_by_guest_session_id = None
        item.claimed_by_name = None
    else:
        guest_session = resolve_guest_session(db, guest_token, item.wishlist_id)
        if not guest_session:
            raise HTTPException(
                status_code=401,
                detail="Sign in or start a guest session to claim this item"
            )
        item.claimed_by_guest_session_id = guest_session.id
        item.claimed_by_user_id = None
        item.claimed_by_name = None

    item.claimed_at = func.now()

    db.commit()
    db.refresh(item)

    return {"message": "Item claimed successfully"}

""" Unclaim an item """
@router.delete('/{item_id}/claim')
def unclaim_item(
    item_id: uuid.UUID,
    current_user: Optional[dict] = Depends(get_current_user_optional),
    guest_token: Optional[str] = Depends(get_guest_token),
    db: Session = Depends(get_db)
):
    """Only the person who claimed the item can release it."""
    item = db.query(WishListItem).filter(WishListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    can_unclaim = False
    if current_user and item.claimed_by_user_id:
        can_unclaim = item.claimed_by_user_id == uuid.UUID(current_user["user_id"])
    elif item.claimed_by_guest_session_id:
        guest_session = resolve_guest_session(db, guest_token, item.wishlist_id)
        can_unclaim = bool(guest_session and guest_session.id == item.claimed_by_guest_session_id)

    # Legacy claims stored only a name, which proves nothing, so they are not
    # releasable by a guest. The wishlist owner can still clear them.
    if not can_unclaim:
        raise HTTPException(status_code=403, detail="You cannot unclaim this item")

    item.claimed_by_user_id = None
    item.claimed_by_guest_session_id = None
    item.claimed_by_name = None
    item.claimed_at = None

    db.commit()
    db.refresh(item)

    return {"message": "Item unclaimed successfully"}

""" Get claimed items for the current user """
@router.get('/claimed/my-items', response_model=List[dict])
def get_my_claimed_items(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all items claimed by the current authenticated user"""
    items = db.query(WishListItem).options(
        joinedload(WishListItem.user),
        joinedload(WishListItem.wishlist)
    ).filter(
        WishListItem.claimed_by_user_id == uuid.UUID(current_user["user_id"])
    ).all()
    
    response_items = []
    for item in items:
        owner = item.user
        wishlist = item.wishlist
        
        # Items inherit due date from their parent wishlist
        wishlist_due_date = None
        if wishlist and wishlist.due_date:
            wishlist_due_date = wishlist.due_date.isoformat() if hasattr(wishlist.due_date, 'isoformat') else str(wishlist.due_date)
        
        response_items.append({
            "id": str(item.id),
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "image": item.image,
            "owner_id": str(item.user_id),
            "owner_name": owner.name if owner and owner.name else owner.username if owner else "Unknown",
            "wishlist_id": str(item.wishlist_id) if item.wishlist_id else None,
            "wishlist_color": wishlist.color if wishlist else None,
            "wishlist_due_date": wishlist_due_date,
            "claimed_at": item.claimed_at.isoformat() if item.claimed_at else None
        })
    
    return response_items