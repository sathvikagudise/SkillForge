"""Clean seed script - creates tables only, no dummy data."""
from app.db import SessionLocal, engine, Base

def create_tables():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully.")

if __name__ == "__main__":
    create_tables()
