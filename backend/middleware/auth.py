from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.orm import Session
from db import get_db
from models import User
from services.auth_service import decode_token
from config import get_settings

settings = get_settings()


async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Extract JWT from Authorization header or access_token cookie.
    Decode it, look up the user, check is_active. Raise 401 on any failure.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Try Authorization header first, then cookie
    token: Optional[str] = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    else:
        token = request.cookies.get("access_token")

    if not token:
        raise credentials_exception

    try:
        payload = decode_token(token, settings.jwt_secret)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_role(*roles: str):
    """Dependency factory — restricts endpoint to users with specified roles."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return role_checker
