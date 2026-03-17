"""
Admin-side KYC management routes.
These are mounted under /api/admin/kyc via the admin_router in admin.py.

GET  /api/admin/kyc            — list KYC submissions (filterable by status/method)
GET  /api/admin/kyc/{user_id}/document-url  — get signed S3 URL for document
GET  /api/admin/kyc/{user_id}/selfie-url    — get signed S3 URL for selfie
POST /api/admin/kyc/{user_id}/approve
POST /api/admin/kyc/{user_id}/reject
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import os
import boto3
from botocore.exceptions import ClientError
import logging

from dependencies import db

logger = logging.getLogger(__name__)

kyc_admin_router = APIRouter(tags=["admin-kyc"])

S3_BUCKET      = os.environ.get("S3_BUCKET_NAME", "")
SIGNED_URL_TTL = 300  # 5 minutes


def _s3():
    return boto3.client(
        "s3",
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        region_name=os.environ.get("AWS_REGION", "ap-south-1"),
    )


def _signed_url(s3_key: Optional[str]) -> Optional[str]:
    """Generate a 5-minute signed GET URL for a private S3 object."""
    if not s3_key:
        return None
    try:
        return _s3().generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": s3_key},
            ExpiresIn=SIGNED_URL_TTL,
        )
    except ClientError as e:
        logger.warning(f"Could not generate signed URL for {s3_key}: {e}")
        return None


class RejectBody(BaseModel):
    reason: str


# ── List KYC ─────────────────────────────────────────────────────────────────

@kyc_admin_router.get("/kyc")
async def list_kyc(
    status: Optional[str] = Query(None, description="pending|approved|rejected|not_submitted"),
    method: Optional[str] = Query(None, description="manual|digilocker"),
    page:   int           = Query(1, ge=1),
    limit:  int           = Query(20, ge=1, le=100),
):
    """Return paginated KYC submissions with optional status/method filters."""
    filt: dict = {}
    if status:
        filt["kyc_status"] = status
    else:
        # Default: only show users who have submitted something
        filt["kyc_status"] = {"$in": ["pending", "approved", "rejected"]}
    if method:
        filt["kyc_method"] = method

    skip  = (page - 1) * limit
    total = await db.users.count_documents(filt)

    cursor = db.users.find(
        filt,
        {
            "_id": 0,
            "user_id": 1,
            "full_name": 1,
            "email": 1,
            "picture": 1,
            "kyc_status": 1,
            "kyc_method": 1,
            "kyc_submitted_at": 1,
            "kyc_verified_at": 1,
            "kyc_rejection_reason": 1,
            "kyc_documents": 1,
            "selfie_s3_key": 1,
            "digilocker_reference_id": 1,
        }
    ).sort("kyc_submitted_at", -1).skip(skip).limit(limit)

    rows = []
    async for user in cursor:
        rows.append(user)

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": rows,
    }


# ── Signed URL helpers ────────────────────────────────────────────────────────

@kyc_admin_router.get("/kyc/{user_id}/document-url")
async def get_document_signed_url(user_id: str):
    """Return a 5-minute presigned URL for the user's KYC document."""
    user = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "kyc_documents": 1}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    docs = user.get("kyc_documents") or []
    s3_key = docs[0].get("s3_key") if docs else None
    url = _signed_url(s3_key)
    if not url:
        raise HTTPException(status_code=404, detail="No document on file.")
    return {"url": url, "expires_in_seconds": SIGNED_URL_TTL}


@kyc_admin_router.get("/kyc/{user_id}/selfie-url")
async def get_selfie_signed_url(user_id: str):
    """Return a 5-minute presigned URL for the user's selfie."""
    user = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "selfie_s3_key": 1}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    url = _signed_url(user.get("selfie_s3_key"))
    if not url:
        raise HTTPException(status_code=404, detail="No selfie on file.")
    return {"url": url, "expires_in_seconds": SIGNED_URL_TTL}


# ── Approve ───────────────────────────────────────────────────────────────────

@kyc_admin_router.post("/kyc/{user_id}/approve")
async def approve_kyc(user_id: str):
    """Approve a KYC submission."""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "kyc_status": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.get("kyc_status") == "approved":
        return {"message": "Already approved."}

    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "kyc_status":          "approved",
            "kyc_verified_at":     now,
            "kyc_rejection_reason": None,
            "is_verified":         True,
            "verification_badge":  True,
        }}
    )
    logger.info(f"KYC approved for user {user_id}")
    return {"message": "KYC approved.", "kyc_status": "approved"}


# ── Reject ────────────────────────────────────────────────────────────────────

@kyc_admin_router.post("/kyc/{user_id}/reject")
async def reject_kyc(user_id: str, body: RejectBody):
    """Reject a KYC submission with a reason."""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "kyc_status": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if not body.reason.strip():
        raise HTTPException(status_code=400, detail="A rejection reason is required.")

    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "kyc_status":          "rejected",
            "kyc_rejection_reason": body.reason.strip(),
            "kyc_verified_at":     None,
            "is_verified":         False,
            "verification_badge":  False,
        }}
    )
    logger.info(f"KYC rejected for user {user_id}: {body.reason}")
    return {"message": "KYC rejected.", "kyc_status": "rejected"}
