from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.base import get_db
from models.user import User, UserCreate, UserResponse

router = APIRouter(prefix='/users', tags=['users'])

@router.post('/', response_model=UserResponse)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    #TODO: Create a new user
    pass

@router.get('/', response_model=List[UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    #TODO: Get all users
    users = db.query(User).offset(skip).limit(limit).all()
    return users