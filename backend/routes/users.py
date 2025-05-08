import os
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from models.base import get_db
from models.user import PublicUserResponse, User, UserCreate, UserResponse, UserUpdate
from middleware.auth import get_current_user
from routes.auth import get_password_hash

from services.s3_service import upload_file_to_s3, delete_file_from_s3, s3_client

router = APIRouter(prefix='/users', tags=['users'])
BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')

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

@router.get('/', response_model=List[UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get('/{user_id}', response_model=UserResponse)
def read_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post('/', response_model=UserResponse)
async def create_user(
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    name: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Check if user exists
    db_user = db.query(User).filter(User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists
    db_username = db.query(User).filter(User.username == username).first()
    if db_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Handle profile picture upload
    pfp_url = None
    if profile_picture:
        try:
            pfp_url = await upload_file_to_s3(profile_picture, folder="profile_pictures")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error uploading profile picture: {str(e)}")

    
    try:
        # Create user with hashed password
        hashed_password = get_password_hash(password)
        db_user = User(
            email=email,
            username=username,
            password=hashed_password,
            name=name,
            pfp=pfp_url,
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    except Exception as e:
        if pfp_url:
            delete_file_from_s3(pfp_url)  # Clean up if user creation fails
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")


@router.put('/{user_id}', response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    email: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    name: Optional[str] = Form(None),
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
    
    # Handle profile picture upload if provided
    if profile_picture:
        # Delete old image if it exists
        if db_user.pfp:
            delete_file_from_s3(db_user.pfp)
        
        # Upload new image
        try:
            pfp_url = await upload_file_to_s3(profile_picture, folder="profile_pictures")
            db_user.pfp = pfp_url
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error uploading profile picture: {str(e)}")
        
    elif remove_profile_picture:
        if db_user.pfp:
            delete_file_from_s3(db_user.pfp)
            db_user.pfp = None
    
    # Update other fields if provided
    if email is not None:
        # Check if the new email is already taken
        if email != db_user.email:
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
        
    if name is not None:
        db_user.name = name
        
    if password is not None:
        db_user.password = get_password_hash(password)
    
    db.commit()
    db.refresh(db_user)
    return db_user

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
    
    # Delete profile picture from S3 if it exists
    if db_user.pfp:
        delete_file_from_s3(db_user.pfp)
    
    db.delete(db_user)
    db.commit()
    
    return {"message": "User deleted successfully"}

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
        image_data = response['Body'].read()
        
        # Return the image with proper content type
        content_type = response.get('ContentType', 'image/jpeg')
        return Response(content=image_data, media_type=content_type)
        
    except Exception as e:
        print(f"Error retrieving profile image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve profile image")
    
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
        id=user.id,
        name=user.name,
        username=user.username,
        pfp=user.pfp 
    )