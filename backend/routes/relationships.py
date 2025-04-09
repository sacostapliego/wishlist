from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from models.base import get_db
from models.user_relationship import UserRelationship, RelationshipCreate, RelationshipUpdate, RelationshipResponse
from models.user import User
from middleware.auth import get_current_user

router = APIRouter(prefix='/relationships', tags=['relationships'])

@router.post('/', response_model=RelationshipResponse)
def create_relationship(
    relationship: RelationshipCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a friend request to another user"""
    # Check if the friend user exists
    friend_user = db.query(User).filter(User.id == relationship.friend_id).first()
    if not friend_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if a relationship already exists
    existing_relationship = db.query(UserRelationship).filter(
        ((UserRelationship.user_id == current_user["user_id"]) & 
         (UserRelationship.friend_id == relationship.friend_id)) |
        ((UserRelationship.user_id == relationship.friend_id) & 
         (UserRelationship.friend_id == current_user["user_id"]))
    ).first()
    
    if existing_relationship:
        raise HTTPException(status_code=400, detail="Relationship already exists")
    
    # Create the relationship
    db_relationship = UserRelationship(
        user_id=current_user["user_id"],
        friend_id=relationship.friend_id,
        status="pending"
    )
    
    db.add(db_relationship)
    db.commit()
    db.refresh(db_relationship)
    
    # Add user details to response
    response_data = db_relationship.__dict__.copy()
    response_data['friend_username'] = friend_user.username
    response_data['friend_name'] = friend_user.name
    
    return response_data

@router.get('/', response_model=List[RelationshipResponse])
def get_relationships(
    status: str = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all relationships for the current user"""
    query = db.query(UserRelationship).filter(
        (UserRelationship.user_id == current_user["user_id"]) | 
        (UserRelationship.friend_id == current_user["user_id"])
    )
    
    if status:
        query = query.filter(UserRelationship.status == status)
    
    relationships = query.all()
    
    # Add user details to each relationship
    result = []
    for rel in relationships:
        # Figure out which user is the friend from current user's perspective
        friend_id = rel.friend_id if rel.user_id == current_user["user_id"] else rel.user_id
        friend_user = db.query(User).filter(User.id == friend_id).first()
        
        rel_dict = rel.__dict__.copy()
        rel_dict['friend_username'] = friend_user.username
        rel_dict['friend_name'] = friend_user.name
        
        result.append(rel_dict)
    
    return result

@router.put('/{relationship_id}', response_model=RelationshipResponse)
def update_relationship(
    relationship_id: uuid.UUID,
    relationship_update: RelationshipUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a relationship (accept/reject friend request)"""
    db_relationship = db.query(UserRelationship).filter(
        UserRelationship.id == relationship_id,
        (UserRelationship.user_id == current_user["user_id"]) | 
        (UserRelationship.friend_id == current_user["user_id"])
    ).first()
    
    if not db_relationship:
        raise HTTPException(status_code=404, detail="Relationship not found")
    
    # Only allow the recipient of the request to update status
    if db_relationship.friend_id == current_user["user_id"] or relationship_update.status is None:
        # Update status if provided
        if relationship_update.status is not None:
            db_relationship.status = relationship_update.status
        
        db.commit()
        db.refresh(db_relationship)
        
        # Get friend user details for response
        friend_id = db_relationship.friend_id if db_relationship.user_id == current_user["user_id"] else db_relationship.user_id
        friend_user = db.query(User).filter(User.id == friend_id).first()
        
        response_data = db_relationship.__dict__.copy()
        response_data['friend_username'] = friend_user.username
        response_data['friend_name'] = friend_user.name
        
        return response_data
    else:
        raise HTTPException(status_code=403, detail="Only the request recipient can update status")

@router.delete('/{relationship_id}', response_model=dict)
def delete_relationship(
    relationship_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a relationship"""
    db_relationship = db.query(UserRelationship).filter(
        UserRelationship.id == relationship_id,
        (UserRelationship.user_id == current_user["user_id"]) | 
        (UserRelationship.friend_id == current_user["user_id"])
    ).first()
    
    if not db_relationship:
        raise HTTPException(status_code=404, detail="Relationship not found")
    
    db.delete(db_relationship)
    db.commit()
    
    return {"message": "Relationship deleted successfully"}