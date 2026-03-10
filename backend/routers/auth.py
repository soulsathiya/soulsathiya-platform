from fastapi import APIRouter, HTTPException, Depends, Cookie, Response, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional

from models.user import UserCreate, UserLogin
from dependencies import auth_service, get_current_user

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserCreate):
    """Register a new user with email and password"""
    existing_user = await auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    if not user_data.password:
        raise HTTPException(status_code=400, detail="Password is required")
    user = await auth_service.create_user(
        email=user_data.email,
        full_name=user_data.full_name,
        password=user_data.password
    )
    session_token = await auth_service.create_session(user["user_id"])
    response = JSONResponse(content={
        "message": "Registration successful",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "picture": user.get("picture")
        }
    })
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    return response


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin):
    """Login with email and password"""
    user = await auth_service.authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    session_token = await auth_service.create_session(user["user_id"])
    response = JSONResponse(content={
        "message": "Login successful",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "picture": user.get("picture"),
            "is_profile_complete": user.get("is_profile_complete", False),
            "is_verified": user.get("is_verified", False),
            "subscription_status": user.get("subscription_status", "free")
        }
    })
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    return response


@router.post("/google-session")
async def google_session(session_id: str):
    """Exchange Google OAuth session_id for user session
    REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    """
    result = await auth_service.handle_google_oauth(session_id)
    if not result:
        raise HTTPException(status_code=401, detail="Google authentication failed")
    user = result["user"]
    session_token = result["session_token"]
    response = JSONResponse(content={
        "message": "Google login successful",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "picture": user.get("picture"),
            "is_profile_complete": user.get("is_profile_complete", False),
            "is_verified": user.get("is_verified", False),
            "subscription_status": user.get("subscription_status", "free")
        }
    })
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    return response


@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "picture": current_user.get("picture"),
        "is_profile_complete": current_user.get("is_profile_complete", False),
        "is_verified": current_user.get("is_verified", False),
        "verification_badge": current_user.get("verification_badge"),
        "subscription_status": current_user.get("subscription_status", "free"),
        "subscription_tier": current_user.get("subscription_tier")
    }


@router.post("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    response: Response,
    current_user: dict = Depends(get_current_user)
):
    """Change password for email/password users and invalidate all existing sessions."""
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    result = await auth_service.change_password(
        user_id=current_user["user_id"],
        old_password=old_password,
        new_password=new_password
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    # Clear the session cookie — user must log in again with new password
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Password changed successfully. Please log in again."}


@router.post("/logout")
async def logout(
    response: Response,
    session_token: Optional[str] = Cookie(None)
):
    """Logout user"""
    if session_token:
        await auth_service.delete_session(session_token)
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}
