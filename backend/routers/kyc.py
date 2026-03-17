"""
KYC (Know Your Customer) routes for SoulSathiya.

Manual KYC:  POST /api/kyc/manual/submit
             GET  /api/kyc/status

DigiLocker (future-ready placeholders):
             GET  /api/kyc/digilocker/initiate
             GET  /api/kyc/digilocker/callback
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from datetime import datetime, timezone
from typing import Optional
import uuid
import os
import io
import boto3
from botocore.exceptions import ClientError
import logging

from dependencies import db, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/kyc", tags=["kyc"])

# ── Constants ────────────────────────────────────────────────────────────────

ALLOWED_MIME = {"image/jpeg", "image/png", "application/pdf"}
ALLOWED_EXT  = {".jpg", ".jpeg", ".png", ".pdf"}
DOC_MAX_BYTES    = 3 * 1024 * 1024   # 3 MB
SELFIE_MAX_BYTES = 2 * 1024 * 1024   # 2 MB
SIGNED_URL_TTL   = 300               # 5 minutes

S3_BUCKET = os.environ.get("S3_BUCKET_NAME", "")


def _s3():
    return boto3.client(
        "s3",
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        region_name=os.environ.get("AWS_REGION", "ap-south-1"),
    )


def _ext(filename: str) -> str:
    return os.path.splitext(filename or "")[-1].lower()


async def _upload_to_s3(file_bytes: bytes, s3_key: str, content_type: str) -> str:
    """Upload bytes to private S3 bucket and return the S3 key."""
    try:
        s3 = _s3()
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type,
            ServerSideEncryption="AES256",
        )
        return s3_key
    except ClientError as e:
        logger.error(f"S3 upload error: {e}")
        raise HTTPException(status_code=500, detail="File upload failed. Please retry.")


# ── Manual KYC ───────────────────────────────────────────────────────────────

@router.post("/manual/submit")
async def submit_manual_kyc(
    document_type: str        = Form(..., description="aadhaar or pan"),
    document_file: UploadFile = File(...),
    selfie_file:   UploadFile = File(...),
    consent:       str        = Form(..., description="Must be 'true'"),
    current_user: dict        = Depends(get_current_user),
):
    """
    Accept document + selfie, validate, upload to private S3,
    and set kyc_status = 'pending'.
    """
    user_id = current_user["user_id"]

    # ── Consent check ────────────────────────────────────────────────────────
    if consent.lower() != "true":
        raise HTTPException(status_code=400, detail="You must consent to identity verification.")

    # ── Validate document_type ───────────────────────────────────────────────
    if document_type not in ("aadhaar", "pan"):
        raise HTTPException(status_code=400, detail="document_type must be 'aadhaar' or 'pan'.")

    # ── Idempotency guard ────────────────────────────────────────────────────
    existing = await db.users.find_one({"user_id": user_id}, {"_id": 0, "kyc_status": 1})
    if existing and existing.get("kyc_status") == "approved":
        raise HTTPException(status_code=400, detail="KYC already approved.")
    if existing and existing.get("kyc_status") == "pending":
        raise HTTPException(status_code=400, detail="KYC already submitted and under review.")

    # ── Validate document file ───────────────────────────────────────────────
    doc_bytes = await document_file.read()
    if len(doc_bytes) > DOC_MAX_BYTES:
        raise HTTPException(status_code=400, detail="Document must be under 3 MB.")
    if _ext(document_file.filename) not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Document must be JPG, PNG, or PDF.")

    # ── Validate selfie file ─────────────────────────────────────────────────
    selfie_bytes = await selfie_file.read()
    if len(selfie_bytes) > SELFIE_MAX_BYTES:
        raise HTTPException(status_code=400, detail="Selfie must be under 2 MB.")
    selfie_ext = _ext(selfie_file.filename)
    if selfie_ext not in {".jpg", ".jpeg", ".png"}:
        raise HTTPException(status_code=400, detail="Selfie must be JPG or PNG.")

    # ── Upload to S3 ─────────────────────────────────────────────────────────
    doc_key    = f"kyc/{user_id}/document/{uuid.uuid4().hex}{_ext(document_file.filename)}"
    selfie_key = f"kyc/{user_id}/selfie/{uuid.uuid4().hex}{selfie_ext}"

    await _upload_to_s3(doc_bytes,    doc_key,    document_file.content_type or "application/octet-stream")
    await _upload_to_s3(selfie_bytes, selfie_key, selfie_file.content_type   or "image/jpeg")

    # ── Persist in DB ────────────────────────────────────────────────────────
    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "kyc_status":    "pending",
            "kyc_method":    "manual",
            "kyc_documents": [{"type": document_type, "s3_key": doc_key}],
            "selfie_s3_key": selfie_key,
            "kyc_submitted_at":       now,
            "kyc_verified_at":        None,
            "kyc_rejection_reason":   None,
            "digilocker_reference_id": None,
        }},
        upsert=False,
    )

    logger.info(f"KYC submitted (manual) for user {user_id}")
    return {"message": "KYC submitted successfully. We'll review within 24 hours.", "kyc_status": "pending"}


# ── KYC Status ───────────────────────────────────────────────────────────────

@router.get("/status")
async def get_kyc_status(current_user: dict = Depends(get_current_user)):
    """Return the current KYC status for the authenticated user."""
    user = await db.users.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0, "kyc_status": 1, "kyc_method": 1, "kyc_rejection_reason": 1,
         "kyc_verified_at": 1, "kyc_submitted_at": 1}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "kyc_status":           user.get("kyc_status", "not_submitted"),
        "kyc_method":           user.get("kyc_method"),
        "kyc_rejection_reason": user.get("kyc_rejection_reason"),
        "kyc_verified_at":      user.get("kyc_verified_at"),
        "kyc_submitted_at":     user.get("kyc_submitted_at"),
    }


# ── DigiLocker — future-ready placeholders ───────────────────────────────────

@router.get("/digilocker/initiate")
async def digilocker_initiate(current_user: dict = Depends(get_current_user)):
    """
    Placeholder: will redirect to DigiLocker OAuth URL.
    Returns a mock redirect URL until the integration is live.
    """
    return {
        "redirect_url": "https://api.digitallocker.gov.in/public/oauth2/1/authorize?MOCK=true",
        "message":      "DigiLocker integration coming soon. Use manual KYC for now.",
        "status":       "mock",
    }


@router.get("/digilocker/callback")
async def digilocker_callback(
    code:  Optional[str] = None,
    state: Optional[str] = None,
    current_user: dict   = Depends(get_current_user),
):
    """
    Placeholder: DigiLocker OAuth callback.
    Simulates a successful government-verified KYC approval.
    """
    user_id = current_user["user_id"]
    now     = datetime.now(timezone.utc)
    ref_id  = f"DL-MOCK-{uuid.uuid4().hex[:12].upper()}"

    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "kyc_status":              "approved",
            "kyc_method":             "digilocker",
            "kyc_verified_at":        now,
            "kyc_rejection_reason":   None,
            "digilocker_reference_id": ref_id,
            "kyc_documents":          [],
            "selfie_s3_key":          None,
        }},
        upsert=False,
    )

    logger.info(f"DigiLocker KYC auto-approved (mock) for user {user_id}, ref={ref_id}")
    return {
        "message":    "DigiLocker verification successful (mock).",
        "kyc_status": "approved",
        "kyc_method": "digilocker",
        "reference_id": ref_id,
    }
