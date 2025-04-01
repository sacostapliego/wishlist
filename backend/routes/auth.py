from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Dict, Any
import bcrypt
import jwt
import os
import uuid
from datetime import datetime

from models.base import get_db
from models.user import User, UserCreate, UserResponse, UserLogin

router = APIRouter(prefix='/auth', tags=['auth'])

# JWT Settings
JWT_SECRET = os.getenv('JWT_SECRET')
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

def get_password_hash(password: str) -> str:
    """Hash a password for storage."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a JWT token."""
    to_encode = data.copy()
    
    # Convert UUID to string if present
    if 'sub' in to_encode and isinstance(to_encode['sub'], uuid.UUID):
        to_encode['sub'] = str(to_encode['sub'])
        
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")
    return encoded_jwt

@router.post('/register', response_model=Dict[str, Any])
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username is taken
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        name=user_data.name,
        pfp=user_data.pfp,
        password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(db_user.id)}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "username": db_user.username,
            "name": db_user.name
        }
    }

@router.post('/login', response_model=Dict[str, Any])
def login(form_data: UserLogin, db: Session = Depends(get_db)):
    """Login an existing user"""
    user = db.query(User).filter(User.email == form_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token with expiry
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "name": user.name,
        }
    }