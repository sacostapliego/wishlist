from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.base import get_db
from models.user import User, UserCreate, UserResponse, UserUpdate
from middleware.auth import get_current_user
from routes.auth import get_password_hash

router = APIRouter(prefix='/users', tags=['users'])

@router.post('/', response_model=UserResponse)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists
    db_username = db.query(User).filter(User.username == user.username).first()
    if db_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user with hashed password
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        password=hashed_password,
        name=user.name,
        pfp=user.pfp
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

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
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put('/{user_id}', response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Only allow users to update their own profile
    if str(user_id) != str(current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to update this user")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields from the request
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Hash password if it's being updated
    if "password" in update_data and update_data["password"]:
        update_data["password"] = get_password_hash(update_data["password"])
    
    # Apply updates
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete('/{user_id}', response_model=dict)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Only allow users to delete their own account
    if str(user_id) != str(current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this user")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    
    return {"message": "User deleted successfully"}