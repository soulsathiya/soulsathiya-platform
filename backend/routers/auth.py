from fastapi import APIRouter, HTTPException, Depends, Cookie, Response, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging
import os

from models.user import UserCreate, UserLogin
from dependencies import auth_service, email_service, get_current_user

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
COOKIE_SECURE = ENVIRONMENT == "production"
COOKIE_SAMESITE = "none" if ENVIRONMENT == "production" else "lax"

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Request / Response schemas for new endpoints
# ---------------------------------------------------------------------------

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ResendVerificationRequest(BaseModel):
    """Optional body — if omitted the endpoint uses the authenticated user's email."""
    pass


# ---------------------------------------------------------------------------
# Existing endpoints
# ---------------------------------------------------------------------------

@router.post("/register")
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserCreate):
    """Register a new user with email and password and send a verification email."""
    existing_user = await auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    if not user_data.password:
        raise HTTPException(status_code=400, detail="Password is required")

    user = await auth_service.create_user(
        email=user_data.email,
        full_name=user_data.full_name,
        password=user_data.password,
    )
    session_token = await auth_service.create_session(user["user_id"])

    # Send verification email (non-blocking — failure does not block registration)
    try:
        token = await auth_service.create_email_verification_token(user["user_id"])
        await email_service.send_verification_email(
            to=user["email"],
            name=user["full_name"],
            token=token,
        )
    except Exception as exc:
        logger.error("Failed to send verification email after registration: %s", exc)

    response = JSONResponse(content={
        "message": "Registration successful. Please check your email to verify your account.",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "picture": user.get("picture"),
            "is_email_verified": user.get("is_email_verified", False),
            "is_profile_complete": user.get("is_profile_complete", False),
            "is_verified": user.get("is_verified", False),
            "subscription_status": user.get("subscription_status", "free"),
            "subscription_tier": user.get("subscription_tier"),
        },
    })
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=7 * 24 * 60 * 60,
        path="/",
    )
    return response


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin):
    """Login with email and password."""
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
            "is_email_verified": user.get("is_email_verified", False),
            "is_profile_complete": user.get("is_profile_complete", False),
            "is_verified": user.get("is_verified", False),
            "subscription_status": user.get("subscription_status", "free"),
        },
    })
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=7 * 24 * 60 * 60,
        path="/",
    )
    return response


@router.post("/google-session")
async def google_session(session_id: str):
    """Exchange Google OAuth session_id for user session.
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
            "is_email_verified": user.get("is_email_verified", False),
            "is_profile_complete": user.get("is_profile_complete", False),
            "is_verified": user.get("is_verified", False),
            "subscription_status": user.get("subscription_status", "free"),
        },
    })
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=7 * 24 * 60 * 60,
        path="/",
    )
    return response


@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "picture": current_user.get("picture"),
        "is_email_verified": current_user.get("is_email_verified", False),
        "is_profile_complete": current_user.get("is_profile_complete", False),
        "is_verified": current_user.get("is_verified", False),
        "verification_badge": current_user.get("verification_badge"),
        "subscription_status": current_user.get("subscription_status", "free"),
        "subscription_tier": current_user.get("subscription_tier"),
    }


@router.post("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    response: Response,
    current_user: dict = Depends(get_current_user),
):
    """Change password for email/password users and invalidate all existing sessions."""
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    result = await auth_service.change_password(
        user_id=current_user["user_id"],
        old_password=old_password,
        new_password=new_password,
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Password changed successfully. Please log in again."}


@router.post("/logout")
async def logout(
    response: Response,
    session_token: Optional[str] = Cookie(None),
):
    """Logout user."""
    if session_token:
        await auth_service.delete_session(session_token)
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}


# ---------------------------------------------------------------------------
# Email verification endpoints  (Issue #2)
# ---------------------------------------------------------------------------

@router.post("/send-verification-email")
@limiter.limit("3/minute")
async def send_verification_email(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Resend the email verification link to the currently authenticated user."""
    if current_user.get("is_email_verified"):
        raise HTTPException(status_code=400, detail="Email is already verified")

    token = await auth_service.create_email_verification_token(current_user["user_id"])
    sent = await email_service.send_verification_email(
        to=current_user["email"],
        name=current_user["full_name"],
        token=token,
    )

    if not sent:
        raise HTTPException(
            status_code=503,
            detail="Could not send verification email. Please try again later.",
        )
    return {"message": "Verification email sent. Please check your inbox."}


@router.post("/verify-email")
async def verify_email(token: str):
    """Verify a user's email address using the token from the verification link.

    The token is passed as a query parameter: POST /api/auth/verify-email?token=<token>
    """
    if not token or len(token) < 10:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    user = await auth_service.verify_email_token(token)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification token. Please request a new verification email.",
        )

    return {
        "message": "Email verified successfully! You can now access all features.",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "is_email_verified": True,
        },
    }


# ---------------------------------------------------------------------------
# Password reset endpoints  (Issue #3)
# ---------------------------------------------------------------------------

@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, body: ForgotPasswordRequest):
    """Request a password reset email.

    Always returns a generic success message to prevent account enumeration,
    even if the email address is not registered.
    """
    token = await auth_service.create_password_reset_token(body.email)

    if token:
        # Fetch the user to get their name for the email
        user = await auth_service.get_user_by_email(body.email)
        name = user["full_name"] if user else "there"
        try:
            await email_service.send_password_reset_email(
                to=body.email,
                name=name,
                token=token,
            )
        except Exception as exc:
            logger.error("Failed to send password reset email to %s: %s", body.email, exc)

    # Always return the same response to prevent email enumeration
    return {
        "message": (
            "If an account with that email exists, we've sent a password reset link. "
            "Please check your inbox (and spam folder)."
        )
    }


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    """Reset the user's password using a valid reset token.

    The token is consumed on first use and expires after 1 hour.
    All existing sessions are invalidated so any stolen session cookies stop working.
    """
    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=400, detail="New password must be at least 8 characters"
        )
    if not body.token or len(body.token) < 10:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    result = await auth_service.reset_password_with_token(
        token=body.token,
        new_password=body.new_password,
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return {
        "message": "Password reset successfully. Please log in with your new password."
    }


@router.get("/verify-reset-token")
async def verify_reset_token(token: str):
    """Check whether a password-reset token is still valid (used by the frontend
    to show or hide the reset form before the user submits).

    GET /api/auth/verify-reset-token?token=<token>
    """
    if not token or len(token) < 10:
        raise HTTPException(status_code=400, detail="Invalid token")

    user = await auth_service.verify_password_reset_token(token)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token. Please request a new password reset.",
        )
    return {"valid": True, "email": user["email"]}
