from sqlalchemy import Column, Integer, String, String, Boolean, DateTime, Float
from sqlalchemy.sql import func

from pydantic import BaseModel, ConfigDict, HttpUrl
from typing import Optional
from datetime import datetime

from .base import Base

class WishListItem(Base):
    
    __tablename__ = 'wishlist_items'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float)
    url = Column(String)
    is_purchased = Column(Boolean, default=False)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
# Pydantic models
class WishtListItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    url: Optional[HttpUrl] = None
    is_purchased: bool = False
    priority: int = 0
    
class WishListItemCreate(WishtListItemBase):
    pass

class WishListItemUpdate(WishtListItemBase):
    pass

class WishListItemReponse(WishtListItemBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)