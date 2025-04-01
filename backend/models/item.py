from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from sqlalchemy.dialects.postgresql import UUID
import uuid

from pydantic import BaseModel, ConfigDict, HttpUrl
from typing import Optional, Union
from datetime import datetime

from .base import Base

class WishListItem(Base):
    
    __tablename__ = 'wishlist_items'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
  
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float)
    url = Column(String)
    is_purchased = Column(Boolean, default=False)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationship
    user = relationship('User', back_populates='wishlist_items')
    
# Pydantic models
class WishListItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    url: Optional[str] = None
    is_purchased: bool = False
    priority: int = 0
    
class WishListItemCreate(WishListItemBase):
    pass

class WishListItemUpdate(WishListItemBase):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    url: Optional[str] = None
    is_purchased: Optional[bool] = None
    priority: Optional[int] = None
    user_id: Optional[int] = None

class WishListItemResponse(WishListItemBase):
    id: Union[int, uuid.UUID]
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)