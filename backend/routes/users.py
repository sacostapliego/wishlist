import os
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from models.base import get_db
from models.user import PublicUserResponse, User, UserResponse
from middleware.auth import get_current_user
from routes.auth import get_password_hash, validate_new_password, verify_password

from services.s3_service import upload_file_to_s3, delete_file_from_s3, image_response, s3_client

router = APIRouter(prefix='/users', tags=['users'])
BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')

# CRUD Operations
@router.get('/me', response_model=UserResponse)
def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the profile of the currently authenticated user"""
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Update an existing user
@router.put('/{user_id}', response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    email: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    current_password: Optional[str] = Form(None),
    name: Optional[str] = Form(None),
    hat_size: Optional[str] = Form(None),
    shirt_size: Optional[str] = Form(None),
    pants_size: Optional[str] = Form(None),
    shoe_size: Optional[str] = Form(None),
    ring_size: Optional[str] = Form(None),
    dress_size: Optional[str] = Form(None),
    jacket_size: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    remove_profile_picture: bool = Form(False)
):
    # Only allow users to update their own profile
    if str(user_id) != str(current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to update this user")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # A stolen token must not be enough to take the account over for good. Changing
    # the password also signs out every token, including the one sent here, and
    # the email is what a future password reset would go to.
    email_changing = email is not None and email != db_user.email
    if password is not None or email_changing:
        if current_password is None or not verify_password(current_password, db_user.password):
            raise HTTPException(status_code=403, detail="Current password is incorrect")
    if password is not None:
        validate_new_password(password)

    # Update other fields if provided. Checked before any upload, so a refused
    # change does not leave a new image behind in S3.
    if email_changing:
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        db_user.email = email

    if username is not None:
        # Check if the new username is already taken
        if username != db_user.username:
            existing_username = db.query(User).filter(User.username == username).first()
            if existing_username:
                raise HTTPException(status_code=400, detail="Username already taken")
        db_user.username = username

    # S3 files to remove once the commit has succeeded. Deleting first would lose
    # the picture if the commit then failed.
    replaced_files = []

    # Handle profile picture upload if provided
    if profile_picture:
        # Upload new image first, so a rejected upload keeps the old one
        try:
            pfp_url = await upload_file_to_s3(profile_picture, folder="profile_pictures")
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error uploading profile picture: {str(e)}")
            raise HTTPException(status_code=500, detail="Error uploading profile picture")

        if db_user.pfp:
            replaced_files.append(db_user.pfp)
        db_user.pfp = pfp_url

    elif remove_profile_picture:
        if db_user.pfp:
            replaced_files.append(db_user.pfp)
            db_user.pfp = None
        
    if name is not None:
        db_user.name = name
        
    if password is not None:
        db_user.password = get_password_hash(password)
        
    if hat_size is not None:
        db_user.hat_size = hat_size
        
    if shirt_size is not None:
        db_user.shirt_size = shirt_size
        
    if pants_size is not None:
        db_user.pants_size = pants_size
        
    if shoe_size is not None:
        db_user.shoe_size = shoe_size
        
    if ring_size is not None:
        db_user.ring_size = ring_size
        
    if dress_size is not None:
        db_user.dress_size = dress_size
        
    if jacket_size is not None:
        db_user.jacket_size = jacket_size

    db.commit()
    for url in replaced_files:
        delete_file_from_s3(url)

    db.refresh(db_user)
    return db_user

# Delete a user
@router.delete('/{user_id}', response_model=dict)
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Only allow users to delete their own account
    if str(user_id) != str(current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this user")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Everything in S3 that belongs to the account, collected now and deleted only
    # after the commit, so a failed delete does not leave rows pointing at nothing.
    files = [db_user.pfp]
    files += [item.image for item in db_user.wishlist_items]
    files += [wishlist.thumbnail_image for wishlist in db_user.wishlists]

    db.delete(db_user)
    db.commit()

    for url in files:
        if url:
            delete_file_from_s3(url)

    return {"message": "User deleted successfully"}

# Get user profile image
@router.get('/{user_id}/profile-image', response_class=Response)
async def get_user_profile_image(
    user_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Get a user's profile picture directly from S3"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.pfp:
        raise HTTPException(status_code=404, detail="Profile image not found")
    
    try:
        # Extract the key from the URL
        # Format: https://bucket-name.s3.amazonaws.com/profile_pictures/image-id.jpg
        s3_key = user.pfp.split(f"https://{BUCKET_NAME}.s3.amazonaws.com/")[1]
        
        # Get the object from S3
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=s3_key)

        # Return the image with proper content type
        return image_response(response)

    except Exception as e:
        print(f"Error retrieving profile image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve profile image")

# Get public user details   
@router.get("/public/{user_id}", response_model=PublicUserResponse)
def get_public_user_details(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get public details for a specific user.
    Does not require authentication.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return PublicUserResponse(
        id=uuid.UUID(str(user.id)),
        name=user.name,
        username=user.username,
        pfp=user.pfp,
        
        hat_size=user.hat_size,
        shirt_size=user.shirt_size,
        pants_size=user.pants_size,
        shoe_size=user.shoe_size,
        ring_size=user.ring_size,
        dress_size=user.dress_size,
        jacket_size=user.jacket_size
    )