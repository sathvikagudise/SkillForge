# app/routes/user.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User
from ..schemas.user import UserOut
from ..utils.auth_dep import get_current_user
from ..schemas.user import UserCreate
from ..utils.security import hash_password, verify_password

router = APIRouter()

@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

@router.put("/me", response_model=UserOut)
def update_profile(payload: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # allow updating name and password (email is unique; changing email needs verification in prod)
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = payload.name or user.name
    if payload.password:
        user.hashed_password = hash_password(payload.password)
    db.commit(); db.refresh(user)
    return UserOut.model_validate(user)

@router.delete("/me")
def delete_account(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user); db.commit()
    return {"status": "deleted"}
