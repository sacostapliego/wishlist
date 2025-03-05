from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import items, users

app = FastAPI(title='Wishlist API')

# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

# rotes
app.include_router(items.router)
app.include_router(users.router)

@app.get('/')
def read_root():
    return {'Hello': 'World'}