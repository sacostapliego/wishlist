from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, EmailStr, ConfigDict, HttpUrl
from typing import Optional
from datetime import datetime
import uuid

from .base import Base

class User(Base):
    __tablename__ = 'users'
    
    # Information
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    pfp = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # User sizes
    hat_size = Column(String(50), nullable=True)
    shirt_size = Column(String(50), nullable=True)
    pants_size = Column(String(50), nullable=True)
    shoe_size = Column(String(50), nullable=True)
    dress_size = Column(String(50), nullable=True)
    jacket_size = Column(String(50), nullable=True)
    ring_size = Column(String(50), nullable=True)

    # Relationships
    wishlists = relationship('Wishlist', back_populates='user', cascade='all, delete-orphan')
    wishlist_items = relationship('WishListItem', back_populates='user', cascade='all, delete-orphan', foreign_keys='WishListItem.user_id')
    
# Pydantic models
class UserBase(BaseModel):
    email: EmailStr
    username: str
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    name: Optional[str] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    # Fields
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    pfp: Optional[str] = None
    
    # Sizes
    hat_size: Optional[str] = None
    shirt_size: Optional[str] = None
    pants_size: Optional[str] = None
    shoe_size: Optional[str] = None
    ring_size: Optional[str] = None
    dress_size: Optional[str] = None
    jacket_size: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PublicUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    username: str
    name: Optional[str] = None
    pfp: Optional[str] = None
    
    hat_size: Optional[str] = None
    shirt_size: Optional[str] = None
    pants_size: Optional[str] = None
    shoe_size: Optional[str] = None
    ring_size: Optional[str] = None
    dress_size: Optional[str] = None
    jacket_size: Optional[str] = None