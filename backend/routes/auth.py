from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Dict, Any, Optional
from services.s3_service import delete_file_from_s3, upload_file_to_s3
from services.rate_limit import limiter, rate_limit
import bcrypt
import jwt
import os
import uuid
from datetime import datetime

from models.base import get_db
from models.user import User, UserCreate, UserResponse, UserLogin
from middleware.auth import session_stamp

router = APIRouter(prefix='/auth', tags=['auth'])

# JWT Settings
JWT_SECRET = os.getenv('JWT_SECRET')
# People open this a few times a year rather than daily, so a short token would
# mean a login on nearly every visit. Changing a password still revokes it early.
ACCESS_TOKEN_EXPIRE_DAYS = 90

# Failed logins per email, on top of the per-address limit on the route. An
# attacker rotating addresses still only gets this many guesses at one account.
LOGIN_FAILURE_LIMIT = 10
LOGIN_FAILURE_WINDOW_SECONDS = 15 * 60

MIN_PASSWORD_LENGTH = 8
# bcrypt only reads the first 72 bytes, and bcrypt 5 raises on anything longer
# rather than quietly ignoring the rest.
MAX_PASSWORD_BYTES = 72

def validate_new_password(password: str) -> None:
    """Rules for a password being set, at sign-up or on a change."""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters"
        )
    if len(password.encode('utf-8')) > MAX_PASSWORD_BYTES:
        raise HTTPException(status_code=400, detail="That password is too long")

def get_password_hash(password: str) -> str:
    """Hash a password for storage."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Checked against when the email has no account, so a miss costs the same bcrypt
# work as a wrong password and the response time does not tell the two apart.
_DUMMY_HASH = get_password_hash('not-a-real-password')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > MAX_PASSWORD_BYTES:
        # No stored password can be this long, so it cannot match.
        return False
    return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a JWT token."""
    to_encode = data.copy()
    
    # Convert UUID to string if present
    if 'sub' in to_encode and isinstance(to_encode['sub'], uuid.UUID):
        to_encode['sub'] = str(to_encode['sub'])
        
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")
    return encoded_jwt

""" Routes """

@router.post('/register', response_model=Dict[str, Any])
async def signup(
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    name: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit('register', limit=10, window_seconds=60 * 60))
):
    """Register a new user"""
    validate_new_password(password)

    # Check if user exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username is taken
    existing_username = db.query(User).filter(User.username == username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Handle profile picture upload
    pfp_url = None
    if profile_picture:
        try:
            print(f"Received profile_picture: filename={profile_picture.filename}, content_type={profile_picture.content_type}")
            
            # Make sure the file has content before uploading
            file_content = await profile_picture.read()
            if file_content:
                # Reset file cursor after reading
                await profile_picture.seek(0)
                pfp_url = await upload_file_to_s3(profile_picture, folder="profile_pictures")
            else:
                print("Warning: Empty file content detected")
                raise HTTPException(status_code=400, detail="Profile picture file is empty")

        except HTTPException:
            raise
        except Exception as e:
            print(f"Profile picture upload error: {str(e)}, type={type(e)}")
            raise HTTPException(status_code=500, detail="Error uploading profile picture")
    
    try:
        # Create new user
        hashed_password = get_password_hash(password)
        db_user = User(
            email=email,
            username=username,
            name=name or username,
            pfp=pfp_url,
            password=hashed_password
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(db_user.id), "sid": session_stamp(db_user)}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": db_user.id,
                "email": db_user.email,
                "username": db_user.username,
                "name": db_user.name,
                "pfp": db_user.pfp
            }
        }
    except Exception as e:
        # Clean up S3 if user creation fails
        if pfp_url:
            delete_file_from_s3(pfp_url)
        # The text can include SQL and column values, so it stays in the log
        print(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating user")

@router.post('/login', response_model=Dict[str, Any])
def login(
    form_data: UserLogin,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit('login', limit=10, window_seconds=60))
):
    """Login an existing user"""
    failure_key = f'login-failures:{form_data.email.lower()}'
    limiter.check(failure_key, LOGIN_FAILURE_LIMIT)

    user = db.query(User).filter(User.email == form_data.email).first()
    password_ok = verify_password(form_data.password, user.password if user else _DUMMY_HASH)
    if not user or not password_ok:
        limiter.record(failure_key, LOGIN_FAILURE_WINDOW_SECONDS)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token with expiry
    access_token_expires = timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    access_token = create_access_token(
        data={"sub": str(user.id), "sid": session_stamp(user)},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "name": user.name,
        }
    }