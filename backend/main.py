"""
THINGS NEEDED FROM INDEX
User name
User pfp
User wishlist name
User wishlist items

Other users name
Other users pfp
Other users wishlist name

"""

""" 
TODO
1. More error handling, with try and except
2. Security Headers
3. Request Rate Limiting
"""


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import items, users, auth, wishlists

app = FastAPI(
    title='Wishlist API',
    openapi_url='/openapi.json',)

# CORS

#TODO: Change to only allow certain origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

# routes
app.include_router(items.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(wishlists.router)

@app.get('/')
def read_root():
    return {'Wish': 'List'}