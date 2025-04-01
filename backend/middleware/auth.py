from fastapi import HTTPException, Depends, Header
import jwt
import os
from dotenv import load_dotenv
from typing import Optional

# Load environment variables
load_dotenv()

# JWT
JWT_SECRET = os.getenv('JWT_SECRET')

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail='No token provided')
    try:
        # Extract token
        token = authorization.replace("Bearer ", "")

        # Decode token
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = payload.get('sub')

        if user_id is None:
            raise HTTPException(status_code=401, detail='Invalid token')   
        
        return {"user_id": user_id}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail='Invalid token')