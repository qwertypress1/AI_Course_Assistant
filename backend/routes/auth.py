from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from jose import JWTError
from db import get_db
from models import User
from schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse, RefreshRequest
from schemas.common import SuccessResponse
from services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from middleware.auth import get_current_user
from config import get_settings

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])

COOKIE_OPTS = dict(httponly=True, samesite="strict", path="/")


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token",  value=access_token,  max_age=1800,   **COOKIE_OPTS)
    response.set_cookie(key="refresh_token", value=refresh_token, max_age=604800, path="/api/v1/auth/refresh", httponly=True, samesite="strict")


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    # Check for duplicate email
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        role="student",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token  = create_access_token(str(user.id), user.role, user.email)
    refresh_token = create_refresh_token(str(user.id))
    _set_auth_cookies(response, access_token, refresh_token)

    return {
        "user": UserResponse.model_validate(user),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    access_token  = create_access_token(str(user.id), user.role, user.email)
    refresh_token = create_refresh_token(str(user.id))
    _set_auth_cookies(response, access_token, refresh_token)

    return {
        "user": UserResponse.model_validate(user),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token(request: Request, body: RefreshRequest, response: Response, db: Session = Depends(get_db)):
    token = body.refresh_token or request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    try:
        payload = decode_token(token, settings.jwt_refresh_secret)
        if payload.get("type") != "refresh":
            raise ValueError
        user_id = payload["sub"]
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    access_token  = create_access_token(str(user.id), user.role, user.email)
    refresh_token_ = create_refresh_token(str(user.id))
    _set_auth_cookies(response, access_token, refresh_token_)

    return {"access_token": access_token, "refresh_token": refresh_token_, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
