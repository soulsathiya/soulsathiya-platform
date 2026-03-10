from fastapi import APIRouter, HTTPException, Depends, Cookie, Response
from fastapi.responses import JSONResponse
from typing import Optional, List

from models.admin import AdminLogin
from dependencies import db, admin_service

admin_router = APIRouter(prefix="/api/admin", tags=["admin"])


# Admin authentication dependency
async def get_current_admin(
    admin_session: Optional[str] = Cookie(None),
    authorization: Optional[str] = None
) -> dict:
    """Get current admin from session token"""
    token = admin_session
    
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Admin authentication required")
    
    admin = await admin_service.verify_admin_session(token)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid or expired admin session")
    
    return admin


def require_role(allowed_roles: List[str]):
    """Dependency to check admin role"""
    async def role_checker(admin: dict = Depends(get_current_admin)):
        if admin.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return admin
    return role_checker


@admin_router.post("/login")
async def admin_login(credentials: AdminLogin):
    """Admin login"""
    admin = await admin_service.authenticate_admin(credentials.email, credentials.password)
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    session_token = await admin_service.create_admin_session(admin["admin_id"])
    
    response = JSONResponse(content={
        "message": "Admin login successful",
        "admin": {
            "admin_id": admin["admin_id"],
            "email": admin["email"],
            "full_name": admin["full_name"],
            "role": admin["role"],
            "require_password_change": admin.get("require_password_change", False)
        }
    })
    
    response.set_cookie(
        key="admin_session",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=24 * 60 * 60,
        path="/"
    )
    
    return response


@admin_router.post("/logout")
async def admin_logout(
    response: Response,
    admin_session: Optional[str] = Cookie(None)
):
    """Admin logout"""
    if admin_session:
        await admin_service.delete_admin_session(admin_session)
    
    response.delete_cookie(key="admin_session", path="/")
    return {"message": "Logged out successfully"}


@admin_router.get("/me")
async def get_admin_info(admin: dict = Depends(get_current_admin)):
    """Get current admin info"""
    return admin


@admin_router.post("/setup")
async def setup_first_admin(email: str, password: str, full_name: str, setup_token: str):
    """Setup first admin account.

    Requires ADMIN_SETUP_TOKEN env var so this unauthenticated endpoint cannot
    be called by arbitrary parties. Once any admin exists, the endpoint is
    permanently disabled regardless of the token value.
    """
    import os
    # 1. Verify the one-time setup token
    expected_token = os.environ.get("ADMIN_SETUP_TOKEN", "")
    if not expected_token:
        raise HTTPException(
            status_code=503,
            detail="Admin setup is disabled: ADMIN_SETUP_TOKEN is not configured."
        )
    if setup_token != expected_token:
        raise HTTPException(status_code=403, detail="Invalid setup token.")
    # 2. Prevent creating a second super-admin via this endpoint
    existing = await db.admin_users.count_documents({})
    if existing > 0:
        raise HTTPException(status_code=400, detail="Admin already exists. Contact super admin.")
    admin = await admin_service.create_admin(
        email=email,
        full_name=full_name,
        password=password,
        role="super_admin",
        require_password_change=False
    )
    return {"message": "First admin created", "admin_id": admin["admin_id"]}


@admin_router.post("/change-password")
async def change_admin_password(
    old_password: str,
    new_password: str,
    admin: dict = Depends(get_current_admin)
):
    """Change admin password"""
    result = await admin_service.change_admin_password(
        admin_id=admin["admin_id"],
        old_password=old_password,
        new_password=new_password
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {"message": result["message"]}


# Dashboard
@admin_router.get("/dashboard/metrics")
async def get_dashboard_metrics(admin: dict = Depends(get_current_admin)):
    """Get dashboard metrics"""
    metrics = await admin_service.get_dashboard_metrics()
    return metrics


# User Management
@admin_router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Get all users with pagination"""
    result = await admin_service.get_all_users(skip=skip, limit=limit, search=search)
    return result


@admin_router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Get user details"""
    user = await admin_service.get_user_detail(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@admin_router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Suspend a user"""
    success = await admin_service.suspend_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User suspended"}


@admin_router.post("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Activate a suspended user"""
    success = await admin_service.activate_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User activated"}


@admin_router.post("/users/{user_id}/verify")
async def verify_user(
    user_id: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Manually verify a user"""
    success = await admin_service.verify_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User verified"}


@admin_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: dict = Depends(require_role(["super_admin"]))
):
    """Delete a user"""
    success = await admin_service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}


# Profile Management
@admin_router.get("/profiles")
async def get_all_profiles(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Get all profiles"""
    result = await admin_service.get_all_profiles(skip=skip, limit=limit, status=status)
    return result


@admin_router.post("/profiles/{profile_id}/flag")
async def flag_profile(
    profile_id: str,
    reason: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Flag a profile for review"""
    success = await admin_service.flag_profile(profile_id, reason)
    if not success:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Profile flagged"}


@admin_router.post("/profiles/{profile_id}/approve")
async def approve_profile(
    profile_id: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Approve a profile"""
    success = await admin_service.approve_profile(profile_id)
    if not success:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Profile approved"}


@admin_router.delete("/photos/{photo_id}")
async def remove_photo(
    photo_id: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Remove a photo"""
    success = await admin_service.remove_photo(photo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Photo not found")
    return {"message": "Photo removed"}


# Subscription Management
@admin_router.get("/subscriptions")
async def get_all_subscriptions(
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(get_current_admin)
):
    """Get all subscriptions"""
    result = await admin_service.get_all_subscriptions(skip=skip, limit=limit)
    return result


@admin_router.put("/subscriptions/{user_id}/tier")
async def update_subscription_tier(
    user_id: str,
    tier: str,
    admin: dict = Depends(require_role(["super_admin"]))
):
    """Update user subscription tier"""
    success = await admin_service.update_user_tier(user_id, tier)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update tier")
    return {"message": f"Tier updated to {tier}"}


@admin_router.post("/subscriptions/{user_id}/extend")
async def extend_subscription(
    user_id: str,
    days: int,
    admin: dict = Depends(require_role(["super_admin"]))
):
    """Extend subscription by days"""
    success = await admin_service.extend_subscription(user_id, days)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to extend subscription")
    return {"message": f"Subscription extended by {days} days"}


@admin_router.post("/subscriptions/{user_id}/cancel")
async def cancel_subscription(
    user_id: str,
    admin: dict = Depends(require_role(["super_admin"]))
):
    """Cancel user subscription"""
    success = await admin_service.cancel_subscription(user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to cancel subscription")
    return {"message": "Subscription cancelled"}


# Deep Exploration Management
@admin_router.get("/deep")
async def get_all_deep_pairs(
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(get_current_admin)
):
    """Get all deep exploration pairs"""
    result = await admin_service.get_all_deep_pairs(skip=skip, limit=limit)
    return result


@admin_router.post("/deep/{pair_id}/revoke")
async def revoke_deep_access(
    pair_id: str,
    admin: dict = Depends(require_role(["super_admin"]))
):
    """Revoke deep exploration access"""
    success = await admin_service.revoke_deep_access(pair_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pair not found")
    return {"message": "Deep exploration access revoked"}


# Reports/Moderation
@admin_router.get("/reports")
async def get_all_reports(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Get all user reports"""
    result = await admin_service.get_all_reports(skip=skip, limit=limit, status=status)
    return result


@admin_router.put("/reports/{report_id}")
async def update_report(
    report_id: str,
    status: str,
    action: Optional[str] = None,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Update report status"""
    success = await admin_service.update_report_status(report_id, status, action)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report updated"}


@admin_router.post("/users/{user_id}/warn")
async def warn_user(
    user_id: str,
    reason: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Warn a user"""
    success = await admin_service.warn_user(user_id, reason)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User warned"}


@admin_router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: str,
    reason: str,
    admin: dict = Depends(require_role(["super_admin"]))
):
    """Ban a user"""
    success = await admin_service.ban_user(user_id, reason)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User banned"}


# Analytics
@admin_router.get("/analytics")
async def get_analytics(admin: dict = Depends(get_current_admin)):
    """Get platform analytics"""
    analytics = await admin_service.get_analytics()
    return analytics
