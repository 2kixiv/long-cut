import datetime
import os

from passlib.context import CryptContext
from jose import jwt

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.environ["JWT_SECRET_KEY"]
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: int) -> str:
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = { "sub": str(user_id), "exp": expire }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_google_token(credential: str) -> dict:
    return id_token.verify_oauth2_token(
        credential,
        google_requests.Request(),
        GOOGLE_CLIENT_ID
    )