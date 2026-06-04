# app/utils/oauth_google.py
from authlib.integrations.starlette_client import OAuth
import os
from ..config import settings

oauth = OAuth()
CONF_URL = "https://accounts.google.com/.well-known/openid-configuration"
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url=CONF_URL,
    client_kwargs={"scope":"openid email profile"},
)
