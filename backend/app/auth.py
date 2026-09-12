from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

class UserContext:
    def __init__(self, user_id: str, username: str, department: str, role: str, accessible_regions: List[str]):
        self.user_id = user_id
        self.username = username
        self.department = department
        self.role = role
        self.accessible_regions = accessible_regions

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> UserContext:
    if not token:
        # Default fallback context for interactive / swagger demo without token header
        return UserContext(
            user_id="usr-police-01",
            username="Inspector Jadeja",
            department="Gujarat Police",
            role="DepartmentAdmin",
            accessible_regions=["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"]
        )
    payload = decode_access_token(token)
    return UserContext(
        user_id=payload.get("sub", "usr-demo"),
        username=payload.get("username", "Demo User"),
        department=payload.get("department", "Gujarat Police"),
        role=payload.get("role", "DepartmentAdmin"),
        accessible_regions=payload.get("accessible_regions", ["Ahmedabad", "Surat", "Vadodara", "Rajkot"])
    )
