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

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    pfp = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # relationship
    wishlist_items = relationship("WishListItem", back_populates="user", cascade="all, delete-orphan")
    
class UserBase(BaseModel):
    email:EmailStr
    username: str
    name: Optional[str] = None
    pfp: Optional[HttpUrl] = None

class UserCreate(UserBase):
    password: str
    
class UserUpdate(UserBase):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    name: Optional[str] = None
    pfp: Optional[HttpUrl] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: uuid.UUID  # Change from int to uuid.UUID
    email: EmailStr
    username: str
    name: Optional[str] = None
    pfp: Optional[HttpUrl] = None
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: EmailStr
    password: str