from models.base import Base, engine

def create_tables():
    # Create all tables defined in your models
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    create_tables()
    print("Tables created successfully!")