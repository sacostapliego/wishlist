from sqlalchemy import Column, Integer, String, String, Boolean, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid

from pydantic import BaseModel, ConfigDict, HttpUrl
from typing import Optional, Union
from datetime import datetime

from .base import Base

class WishListItem(Base):
    
    __tablename__ = 'wishlist_items'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float)
    url = Column(String)
    is_purchased = Column(Boolean, default=False)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
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
    pass

class WishListItemResponse(WishListItemBase):
    id: Union[int, uuid.UUID]
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)