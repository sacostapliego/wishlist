"""
THINGS NEEDED FROM INDEX
"""

""" 
TODO
1. More error handling, with try and except
2. Security Headers
3. Request Rate Limiting
"""


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import items, users, auth, wishlists, relationships

app = FastAPI(
    title='Wishlist API',
    openapi_url='/openapi.json',)

# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:3000',                        # Local development
        'http://localhost:8000',                        # 
        'http://localhost:8081',                        # 
        'http://localhost:5173',                        # Vite dev server
        'https://cardinal-wishlist.onrender.com',       # Production frontend
        'https://cardinal-wishlist-api.onrender.com',   # Production API
        
    ],
    allow_credentials=True,
    allow_methods=['GET','POST','PUT','PATCH','DELETE','OPTIONS', 'HEAD'],
    allow_headers=[
        'Authorization',
        'Content-Type',
        'Accept',
        'Origin',
        'X-Requested-With',
        'X-CSRF-Token'
    ],
)

# routes
app.include_router(items.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(wishlists.router)
app.include_router(relationships.router)

@app.get('/')
def read_root():
    return {'Wish': 'List'}