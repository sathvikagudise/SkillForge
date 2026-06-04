from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models
from ..schemas.user import UserCreate, UserOut
from ..schemas.auth import Token
from ..utils.security import hash_password, verify_password
from ..utils.jwt import create_access_token
from ..config import settings
from authlib.integrations.starlette_client import OAuth
import os

router = APIRouter()

# Simple signup
@router.post("/signup", response_model=UserOut)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    try:
        # Debug: inspect payload safely (don't log raw passwords)
        try:
            pw_bytes = payload.password.encode('utf-8') if payload.password is not None else b''
            masked = (payload.password[:2] + '...' + payload.password[-2:]) if payload.password and len(payload.password) > 6 else (payload.password or '')
            print(f"Signup attempt: email={payload.email!r}, name={payload.name!r}, password_bytes={len(pw_bytes)}, password_mask={masked!r}")
        except Exception:
            print(f"Signup attempt: could not inspect payload for email={getattr(payload,'email',None)!r}")

        existing = db.query(models.User).filter(models.User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        # Basic server-side validation
        if not payload.password or len(payload.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

        # Delegate hashing to helper (it will handle long passwords safely by hashing first)
        # NOTE: do not reject here based on byte-length to avoid false-positives; hash_password will handle long inputs.
        hashed = hash_password(payload.password)
        user = models.User(email=payload.email, name=payload.name, hashed_password=hashed)
        db.add(user)
        db.commit()
        db.refresh(user)
        return UserOut.model_validate(user)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@router.post("/login", response_model=Token)
def login(payload: UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer"}

# Google OAuth server-side
oauth = OAuth()
CONF_URL = "https://accounts.google.com/.well-known/openid-configuration"
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url=CONF_URL,
    client_kwargs={"scope":"openid email profile"},
)

@router.get("/google")
async def auth_google(request: Request):
    # Ensure OAuth client is configured
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    if not client_id or not client_secret:
        print("Google OAuth attempted but GOOGLE_CLIENT_ID/SECRET not set")
        raise HTTPException(status_code=500, detail="Google OAuth not configured on server")

    try:
        # authlib expects a string for the redirect URI; ensure we pass one
        redirect_uri = str(request.url_for("auth_google_callback"))
        return await oauth.google.authorize_redirect(request, redirect_uri)
    except Exception as e:
        print(f"Error starting Google OAuth: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start Google OAuth: {e}")

@router.get("/google/callback")
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = token.get("userinfo") or await oauth.google.parse_id_token(request, token)
    except Exception as e:
        print(f"Error in Google OAuth callback: {e}")
        raise HTTPException(status_code=500, detail=f"Google OAuth callback failed: {e}")
    email = userinfo["email"]
    google_id = userinfo["sub"]
    name = userinfo.get("name")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(email=email, name=name, google_id=google_id)
        db.add(user); db.commit(); db.refresh(user)
    else:
        user.google_id = google_id
        db.commit()
    jwt_token = create_access_token(subject=str(user.id))
    # Redirect back to frontend with token (adjust to your frontend flow)
    redirect_to = os.getenv("FRONTEND_URL", "http://localhost:3000") + f"/oauth-success?token={jwt_token}"
    return RedirectResponse(url=redirect_to)
