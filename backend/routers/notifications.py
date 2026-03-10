from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional

from dependencies import get_current_user, notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user notifications"""
    notifications = await notification_service.get_user_notifications(
        user_id=current_user["user_id"],
        unread_only=unread_only,
        limit=limit
    )
    return {"notifications": notifications}


@router.get("/count")
async def get_notification_count(current_user: dict = Depends(get_current_user)):
    """Get unread notification count"""
    count = await notification_service.get_unread_count(current_user["user_id"])
    return {"unread_count": count}


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    success = await notification_service.mark_as_read(
        notification_id=notification_id,
        user_id=current_user["user_id"]
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}


@router.post("/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    count = await notification_service.mark_all_as_read(current_user["user_id"])
    return {"message": f"Marked {count} notifications as read"}


# ──────────────────────────────────────────────────────────────────────────────
# Email preference endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/email-preferences")
async def get_email_preferences(current_user: dict = Depends(get_current_user)):
    """Get the current user's email notification preferences."""
    prefs = await notification_service.get_email_preferences(current_user["user_id"])
    return prefs


@router.put("/email-preferences")
async def update_email_preferences(
    updates: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update one or more email notification preferences."""
    # Only allow boolean values for known preference keys
    allowed_keys = {"interest_received", "new_message", "weekly_digest", "deep_exploration"}
    filtered = {k: bool(v) for k, v in updates.items() if k in allowed_keys}
    if not filtered:
        raise HTTPException(status_code=400, detail="No valid preference keys provided")
    prefs = await notification_service.update_email_preferences(current_user["user_id"], filtered)
    return prefs


@router.post("/unsubscribe")
async def unsubscribe_via_token(token: str = Query(...)):
    """
    One-click unsubscribe endpoint (no auth required).
    Validates the token and disables the associated email type.
    """
    result = await notification_service.process_unsubscribe(token)
    if not result:
        raise HTTPException(status_code=400, detail="Invalid or already used unsubscribe token")
    return {
        "message": f"Successfully unsubscribed from {result['email_type'].replace('_', ' ')} emails"
    }
