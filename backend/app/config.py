import os
from pathlib import Path
from dotenv import load_dotenv

# Load the .env file located next to this config module (backend/app/.env)
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")
    GCS_PROJECT = os.getenv("GCS_PROJECT")
    GCS_BUCKET = os.getenv("GCS_BUCKET")
    GCS_CREDENTIALS_JSON = os.getenv("GCS_CREDENTIALS_JSON")

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_FAST_MODEL = os.getenv("GEMINI_FAST_MODEL", "gemini-2.0-flash")
    GEMINI_PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-2.0-flash")

    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-coder:6.7b")

    JWT_SECRET = os.getenv("JWT_SECRET", "devsecret")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

    # Secret used for session middleware (used by OAuth flows)
    SESSION_SECRET = os.getenv("SESSION_SECRET", JWT_SECRET)

    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    API_URL = os.getenv("API_URL", "http://localhost:8000")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")

    # SMTP / Email configuration (used for sending reminders, notifications)
    SMTP_SERVER = os.getenv("SMTP_SERVER")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")
settings = Settings()
