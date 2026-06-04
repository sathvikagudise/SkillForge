# app/utils/auth_dep.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User
from ..utils.jwt import decode_access_token
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
    except Exception as e:
        try:
            # Mask token for logs: show first/last 8 chars if long
            masked = token
            if isinstance(token, str) and len(token) > 16:
                masked = token[:8] + '...' + token[-8:]
        except Exception:
            masked = '<unavailable>'
        logger.exception("Failed to decode access token %s: %s", masked, e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
