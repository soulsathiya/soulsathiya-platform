from fastapi import APIRouter, HTTPException, Depends, Cookie, Response
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from typing import Optional
import os
import boto3
from botocore.exceptions import ClientError
import logging

from dependencies import db, get_current_user, auth_service
from models.user import DELETED_ACCOUNT_ERROR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/account", tags=["account"])

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
COOKIE_SECURE = ENVIRONMENT == "production"
COOKIE_SAMESITE = "none" if ENVIRONMENT == "production" else "lax"


def _get_s3():
    return boto3.client(
        "s3",
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        region_name=os.environ.get("AWS_REGION", "ap-south-1"),
    )


@router.delete("")
async def delete_account(
    session_token: Optional[str] = Cookie(None),
    current_user: dict = Depends(get_current_user),
):
    """Soft-delete the currently logged-in user's account.

    - Sets is_active=False, status='deleted', deleted_at=now in MongoDB
    - Deletes all S3 photos for the user
    - Invalidates all sessions
    - Clears the session cookie
    Does NOT physically remove any DB records.
    """
    user_id = current_user["user_id"]

    # ------------------------------------------------------------------
    # 1. Delete S3 photos
    # ------------------------------------------------------------------
    s3_bucket = os.environ.get("S3_BUCKET_NAME", "")
    if s3_bucket:
        try:
            s3 = _get_s3()
            photos = await db.photos.find(
                {"user_id": user_id}, {"_id": 0, "s3_key": 1}
            ).to_list(20)
            for photo in photos:
                key = photo.get("s3_key")
                if key:
                    try:
                        s3.delete_object(Bucket=s3_bucket, Key=key)
                        # Also attempt thumbnail deletion
                        s3.delete_object(Bucket=s3_bucket, Key=f"thumbnails/{key}")
                    except ClientError as exc:
                        logger.warning("S3 delete failed for key %s: %s", key, exc)
        except Exception as exc:
            logger.error("S3 cleanup error during account deletion for %s: %s", user_id, exc)
            # Non-fatal — continue with soft delete

    # ------------------------------------------------------------------
    # 2. Soft-delete user record
    # ------------------------------------------------------------------
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "is_active": False,
            "status": "deleted",
            "deleted_at": datetime.now(timezone.utc),
        }},
    )

    # ------------------------------------------------------------------
    # 3. Invalidate all sessions
    # ------------------------------------------------------------------
    await db.user_sessions.delete_many({"user_id": user_id})

    logger.info("Account soft-deleted for user %s", user_id)

    # ------------------------------------------------------------------
    # 4. Clear session cookie and respond
    # ------------------------------------------------------------------
    response = JSONResponse(
        content={"message": "Your account has been successfully deleted."}
    )
    response.delete_cookie(key="session_token", path="/")
    return response
