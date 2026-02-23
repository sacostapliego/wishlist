from html import escape
import os
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid

from services.s3_service import upload_file_to_s3, delete_file_from_s3
from models.base import get_db
from models.wishlist import Wishlist, WishlistCreate, WishlistUpdate, WishlistResponse
from models.item import WishListItem
from middleware.auth import get_current_user
from models.user import User

from services.s3_service import upload_file_to_s3, delete_file_from_s3, s3_client
BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')


router = APIRouter(prefix='/wishlists', tags=['wishlists'])

def build_wishlist_response(db_wishlist: Wishlist, item_count: int) -> dict:
    """Helper to build a wishlist response dict with item count"""
    response_data = {k: v for k, v in db_wishlist.__dict__.items() if not k.startswith('_')}
    response_data['item_count'] = item_count
    return response_data

@router.post('/', response_model=WishlistResponse)
async def create_wishlist(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    is_public: bool = Form(False),
    image: Optional[str] = Form(None),
    thumbnail_type: Optional[str] = Form('icon'),
    thumbnail_icon: Optional[str] = Form(None),
    thumbnail_image: Optional[UploadFile] = File(None),
    use_item_colors: bool = Form(False),
    default_view: str = Form('list'),
    due_date: Optional[str] = Form(None),  # Accept as string, parse below
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new wishlist"""
    from datetime import date as date_type
    thumbnail_image_url: Optional[str] = None

    if thumbnail_type == 'image' and thumbnail_image is not None:
        try:
            thumbnail_image_url = await upload_file_to_s3(thumbnail_image, folder="wishlist_thumbnails")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error uploading thumbnail: {str(e)}")

    parsed_due_date: Optional[date_type] = None
    if due_date:
        try:
            parsed_due_date = date_type.fromisoformat(due_date)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid due_date format. Use YYYY-MM-DD.")

    db_wishlist = Wishlist(
        user_id=current_user["user_id"],
        title=title,
        description=description,
        color=color,
        is_public=is_public,
        image=image,
        thumbnail_type=thumbnail_type if thumbnail_type is not None else 'icon',
        thumbnail_icon=thumbnail_icon if thumbnail_type == 'icon' else None,
        thumbnail_image=thumbnail_image_url,
        use_item_colors=use_item_colors,
        default_view=default_view,
        due_date=parsed_due_date
    )
    db.add(db_wishlist)
    db.commit()
    db.refresh(db_wishlist)

    item_count = db.query(func.count(WishListItem.id)).filter(
        WishListItem.wishlist_id == db_wishlist.id
    ).scalar() or 0

    return build_wishlist_response(db_wishlist, item_count)

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

    result = []
    for wishlist in wishlists:
        item_count = db.query(func.count(WishListItem.id)).filter(
            WishListItem.wishlist_id == wishlist.id
        ).scalar() or 0
        result.append(build_wishlist_response(wishlist, item_count))

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

    if db_wishlist is None:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    item_count = db.query(func.count(WishListItem.id)).filter(
        WishListItem.wishlist_id == db_wishlist.id
    ).scalar() or 0

    return build_wishlist_response(db_wishlist, item_count)

@router.put('/{wishlist_id}', response_model=WishlistResponse)
async def update_wishlist(
    wishlist_id: uuid.UUID,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    is_public: Optional[bool] = Form(None),
    image: Optional[str] = Form(None),
    thumbnail_type: Optional[str] = Form(None),
    thumbnail_icon: Optional[str] = Form(None),
    thumbnail_image: Optional[UploadFile] = File(None),
    remove_thumbnail_image: bool = Form(False),
    use_item_colors: Optional[bool] = Form(None),
    default_view: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    remove_due_date: bool = Form(False),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a wishlist"""
    from datetime import date as date_type
    db_wishlist = db.query(Wishlist).filter(
        Wishlist.id == wishlist_id,
        Wishlist.user_id == current_user["user_id"]
    ).first()

    if db_wishlist is None:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    # Handle thumbnail image upload
    if thumbnail_image is not None:
        if db_wishlist.thumbnail_image is not None:
            delete_file_from_s3(db_wishlist.thumbnail_image)
        try:
            db_wishlist.thumbnail_image = await upload_file_to_s3(thumbnail_image, folder="wishlist_thumbnails")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error uploading thumbnail: {str(e)}")
    elif remove_thumbnail_image:
        if db_wishlist.thumbnail_image is not None:
            delete_file_from_s3(db_wishlist.thumbnail_image)
            db_wishlist.thumbnail_image = None

    # Handle due date
    if remove_due_date:
        db_wishlist.due_date = None
    elif due_date is not None:
        try:
            db_wishlist.due_date = date_type.fromisoformat(due_date)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid due_date format. Use YYYY-MM-DD.")

    # Update scalar fields
    if title is not None:
        db_wishlist.title = title
    if description is not None:
        db_wishlist.description = description
    if color is not None:
        db_wishlist.color = color
    if is_public is not None:
        db_wishlist.is_public = is_public
    if image is not None:
        db_wishlist.image = image
    if thumbnail_type is not None:
        db_wishlist.thumbnail_type = thumbnail_type
    if thumbnail_icon is not None:
        db_wishlist.thumbnail_icon = thumbnail_icon
    if use_item_colors is not None:
        db_wishlist.use_item_colors = use_item_colors
    if default_view is not None:
        db_wishlist.default_view = default_view

    db.commit()
    db.refresh(db_wishlist)

    item_count = db.query(func.count(WishListItem.id)).filter(
        WishListItem.wishlist_id == db_wishlist.id
    ).scalar() or 0

    return build_wishlist_response(db_wishlist, item_count)

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

    if db_wishlist is None:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    for item in db_wishlist.items:
        if item.image is not None:
            delete_file_from_s3(str(item.image))

    if db_wishlist.thumbnail_image is not None:
        delete_file_from_s3(db_wishlist.thumbnail_image)

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

    result = []
    for wishlist in wishlists:
        item_count = db.query(func.count(WishListItem.id)).filter(
            WishListItem.wishlist_id == wishlist.id
        ).scalar() or 0
        result.append(build_wishlist_response(wishlist, item_count))

    return result

@router.get('/public/{wishlist_id}', response_model=WishlistResponse)
def get_public_wishlist(
    wishlist_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Get a public wishlist without authentication"""
    db_wishlist = db.query(Wishlist).filter(
        Wishlist.id == wishlist_id,
        Wishlist.is_public == True
    ).first()

    if db_wishlist is None:
        raise HTTPException(status_code=404, detail="Public wishlist not found")

    item_count = db.query(func.count(WishListItem.id)).filter(
        WishListItem.wishlist_id == db_wishlist.id
    ).scalar() or 0

    return build_wishlist_response(db_wishlist, item_count)

@router.get('/{wishlist_id}/thumbnail', response_class=Response)
async def get_wishlist_thumbnail(
    wishlist_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Get a wishlist's thumbnail image directly from S3"""
    db_wishlist = db.query(Wishlist).filter(
        Wishlist.id == wishlist_id
    ).first()

    if db_wishlist is None or db_wishlist.thumbnail_image is None:
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    try:
        s3_key = db_wishlist.thumbnail_image.split(f"https://{BUCKET_NAME}.s3.amazonaws.com/")[1]

        s3_response = s3_client.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        image_data = s3_response['Body'].read()

        content_type = s3_response.get('ContentType', 'image/jpeg')
        return Response(content=image_data, media_type=content_type)

    except Exception as e:
        print(f"Error retrieving wishlist thumbnail: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve thumbnail")




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

    if db_wishlist is None:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    owner = db.query(User).filter(User.id == db_wishlist.user_id).first()
    owner_name = (str(owner.name) if owner.name else str(owner.username)) if owner is not None else "User"

    frontend_base = (os.getenv('PUBLIC_FRONTEND_URL', 'https://cardinal-wishlist.onrender.com') or '').rstrip('/')
    api_base = (os.getenv('PUBLIC_API_URL', 'https://cardinal-wishlist-api.onrender.com') or '').rstrip('/')

    def is_absolute(url: str) -> bool:
        return url.startswith('http://') or url.startswith('https://')

    frontend_url = f"{frontend_base}/shared/{wishlist_id}"

    og_image = f"{frontend_base}/favicon.ico"
    if db_wishlist.image is not None and is_absolute(db_wishlist.image):
        og_image = db_wishlist.image
    elif owner is not None and owner.pfp is not None:
        og_image = f"{api_base}/users/{owner.id}/profile-image"

    title_str = db_wishlist.title if db_wishlist.title is not None else "Shared Wishlist"
    desc_str = db_wishlist.description if db_wishlist.description is not None else f"{owner_name}'s wishlist"

    safe_title = escape(title_str)
    safe_description = escape(desc_str)
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
        <link rel="canonical" href="{safe_frontend_url}">
        <meta name="robots" content="noindex, nofollow">

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

        <!-- Fallback redirect for no-JS environments (crawlers still see meta tags) -->
        <meta http-equiv="refresh" content="0;url={safe_frontend_url}">

        <!-- Minimal styling so the page is just a dark background -->
        <style>
          html, body {{
            background: #141414;
            margin: 0;
            height: 100%;
          }}
        </style>

        <!-- Instant JS redirect for real users to avoid flicker -->
        <script>
          (function() {{
            try {{
              window.location.replace("{safe_frontend_url}");
            }} catch (e) {{
              window.location.href = "{safe_frontend_url}";
            }}
          }})();
        </script>
    </head>
    <body></body>
    </html>
    """
    return HTMLResponse(
            content=html_content,
            headers={"Cache-Control": "public, max-age=600"}
        )