from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from dotenv import load_dotenv
import os

# load environment variables
load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Database URL: {DATABASE_URL}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()