# app/services/user_service.py
from sqlalchemy.orm import Session
from ..models import User
from ..utils.security import hash_password

def create_user(db: Session, email: str, password: str, name: str = None):
    user = User(email=email, name=name, hashed_password=hash_password(password))
    db.add(user); db.commit(); db.refresh(user)
    return user

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()
