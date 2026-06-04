from passlib.context import CryptContext
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    # Bcrypt has a 72-byte limit, so hash long passwords first
    if len(password.encode('utf-8')) > 72:
        password = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    # If the plain password is long, hash it first
    if len(plain.encode('utf-8')) > 72:
        plain = hashlib.sha256(plain.encode()).hexdigest()
    return pwd_context.verify(plain, hashed)
