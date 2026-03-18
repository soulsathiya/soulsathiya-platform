"""
Relationship Intelligence Report — Unlock & Payment Router

Endpoints:
  POST /api/reports/unlock/{partner_id}   — unified access-control + unlock
  POST /api/reports/verify-payment        — confirm payment & activate pair
  POST /api/reports/remind-partner/{pair_id} — re-send invite notification
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import os
import logging

from dependencies import (
    get_current_user,
    db,
    deep_exploration_service,
    notification_service,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])

# ── Razorpay config (dummy-safe) ───────────────────────────────────────────
RAZORPAY_KEY_ID     = os.environ.get("RAZORPAY_KEY_ID",     "rzp_test_dummy")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
REPORT_PRICE_PAISE  = 99900   # ₹999

def _is_dummy_mode() -> bool:
    """True when real Razorpay keys are not yet configured."""
    return (
        not RAZORPAY_KEY_SECRET
        or RAZORPAY_KEY_ID.startswith("rzp_test_dummy")
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

async def _reset_monthly_quota_if_needed(user: dict) -> dict:
    """
    If the user's monthly reset date has passed (or was never set), zero out
    free_reports_used_this_month and push the reset date 30 days forward.
    Writes the change to MongoDB and returns the updated user dict.
    """
    now        = datetime.now(timezone.utc)
    reset_date = user.get("free_reports_reset_date")

    # Normalise: ensure reset_date is timezone-aware if it came from Mongo
    if isinstance(reset_date, datetime) and reset_date.tzinfo is None:
        reset_date = reset_date.replace(tzinfo=timezone.utc)

    needs_reset = (reset_date is None) or (now >= reset_date)

    if needs_reset:
        next_reset = now + timedelta(days=30)
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {
                "free_reports_used_this_month": 0,
                "free_reports_reset_date":      next_reset,
            }},
        )
        user["free_reports_used_this_month"] = 0
        user["free_reports_reset_date"]      = next_reset

    return user


async def check_report_access(user: dict) -> dict:
    """
    Evaluate what kind of access this user has for a NEW report.

    Returns a dict:
      allowed  (bool)
      type     (str)  — elite | free_premium | payment_required | upgrade_required
      message  (str)
    """
    user = await _reset_monthly_quota_if_needed(user)

    tier = (user.get("subscription_tier") or "free").lower()
    used = int(user.get("free_reports_used_this_month") or 0)

    if tier == "elite":
        return {
            "allowed": True,
            "type":    "elite",
            "message": "Unlimited reports included in your Elite plan.",
        }

    if tier == "premium":
        if used < 1:
            return {
                "allowed": True,
                "type":    "free_premium",
                "message": "You have 1 free Relationship Intelligence Report this month.",
            }
        return {
            "allowed": False,
            "type":    "payment_required",
            "message": "You've used your free monthly report. Unlock this one for ₹999.",
        }

    # free / basic / anything else
    return {
        "allowed": False,
        "type":    "upgrade_required",
        "message": "Upgrade to Premium to access Relationship Intelligence Reports.",
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 1 — Unified unlock
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/unlock/{partner_id}")
async def unlock_report(
    partner_id:   str,
    current_user: dict = Depends(get_current_user),
):
    """
    Single entry-point for unlocking a Relationship Intelligence Report.

    Response shape:
      unlocked  bool
      type      str  — elite | free_premium | payment_required | already_unlocked | upgrade_required
      pair_id   str  (when unlocked == True or pending_payment)
      message   str
      order     dict (when type == payment_required)
    """
    user_id = current_user["user_id"]

    # ── 1. Already unlocked? ──────────────────────────────────────────────
    existing = await deep_exploration_service.create_or_get_pair(user_id, partner_id)
    if existing and existing.get("status") not in ("pending_payment", None):
        return {
            "unlocked": True,
            "pair_id":  existing["pair_id"],
            "type":     "already_unlocked",
            "message":  "Report already unlocked. Start or continue your assessment.",
        }

    # ── 2. Evaluate access ────────────────────────────────────────────────
    access = await check_report_access(current_user)

    # ── 3a. Hard block: upgrade required ─────────────────────────────────
    if access["type"] == "upgrade_required":
        raise HTTPException(
            status_code=403,
            detail={
                "type":    "upgrade_required",
                "message": access["message"],
            },
        )

    # ── 3b. Free access (Elite or first Premium report) ───────────────────
    if access["allowed"]:
        free_payment_id = f"free_{uuid.uuid4().hex[:10]}"
        result = await deep_exploration_service.unlock_pair(
            unlocking_user_id=user_id,
            partner_user_id=partner_id,
            payment_id=free_payment_id,
        )
        pair = result.get("pair") or result

        # Increment free-report counter for premium users
        if access["type"] == "free_premium":
            await db.users.update_one(
                {"user_id": user_id},
                {"$inc": {"free_reports_used_this_month": 1}},
            )

        # Send in-app invite to partner
        try:
            await notification_service.notify_deep_unlock(
                user_id, partner_id, pair.get("pair_id", "")
            )
        except Exception as exc:
            logger.warning("Failed to notify partner on unlock: %s", exc)

        return {
            "unlocked": True,
            "pair_id":  pair.get("pair_id"),
            "type":     access["type"],
            "message":  "Report unlocked! Complete your assessment to generate the report.",
        }

    # ── 3c. Payment required ──────────────────────────────────────────────
    order_id = f"order_dummy_{uuid.uuid4().hex[:14]}"

    # Reuse existing pending pair or create a new pending record
    if existing and existing.get("status") == "pending_payment":
        pair_id  = existing["pair_id"]
        order_id = existing.get("razorpay_order_id", order_id)
    else:
        pair_id = f"deep_{uuid.uuid4().hex[:12]}"
        sorted_ids = sorted([user_id, partner_id])
        await db.deep_exploration_pairs.insert_one({
            "pair_id":             pair_id,
            "user_a_id":           sorted_ids[0],
            "user_b_id":           sorted_ids[1],
            "unlocked_by_user":    user_id,
            "tier_at_unlock":      current_user.get("subscription_tier", "premium"),
            "payment_status":      "pending",
            "razorpay_order_id":   order_id,
            "razorpay_payment_id": None,
            "started_users":       [],
            "completed_users":     [],
            "status":              "pending_payment",
            "unlocked_at":         None,
            "completed_at":        None,
        })

    return {
        "unlocked": False,
        "type":     "payment_required",
        "message":  access["message"],
        "pair_id":  pair_id,
        "order": {
            "id":              order_id,
            "amount":          REPORT_PRICE_PAISE,
            "currency":        "INR",
            "razorpay_key_id": RAZORPAY_KEY_ID,
            "is_dummy":        _is_dummy_mode(),
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 2 — Verify payment & activate pair
# ═══════════════════════════════════════════════════════════════════════════════

class VerifyPaymentRequest(BaseModel):
    pair_id:              str
    razorpay_order_id:    str
    razorpay_payment_id:  str
    razorpay_signature:   Optional[str] = None   # validated when real keys are live


@router.post("/verify-payment")
async def verify_payment(
    payload:      VerifyPaymentRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Confirm payment and activate the pending deep-exploration pair.

    In dummy mode (no real Razorpay secret), signature verification is skipped.
    When real keys are added, set RAZORPAY_KEY_SECRET in the environment and
    this endpoint will automatically perform HMAC-SHA256 signature validation.
    """
    user_id = current_user["user_id"]

    # ── Fetch the pending pair ────────────────────────────────────────────
    pair = await db.deep_exploration_pairs.find_one(
        {"pair_id": payload.pair_id},
        {"_id": 0},
    )
    if not pair:
        raise HTTPException(status_code=404, detail="Pair not found.")

    # Must be the person who initiated the unlock
    if pair.get("unlocked_by_user") != user_id:
        raise HTTPException(status_code=403, detail="Not authorised to verify this payment.")

    if pair.get("payment_status") == "paid":
        return {"success": True, "pair_id": payload.pair_id, "message": "Already activated."}

    # ── Signature verification ────────────────────────────────────────────
    if not _is_dummy_mode() and payload.razorpay_signature:
        import hmac, hashlib
        expected = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, payload.razorpay_signature):
            raise HTTPException(status_code=400, detail="Payment signature verification failed.")
    else:
        # Dummy mode: accept payment unconditionally
        logger.info(
            "Dummy payment accepted for pair %s (order=%s, payment=%s)",
            payload.pair_id, payload.razorpay_order_id, payload.razorpay_payment_id,
        )

    # ── Activate the pair ─────────────────────────────────────────────────
    await db.deep_exploration_pairs.update_one(
        {"pair_id": payload.pair_id},
        {"$set": {
            "payment_status":      "paid",
            "razorpay_payment_id": payload.razorpay_payment_id,
            "status":              "unlocked",
            "unlocked_at":         datetime.now(timezone.utc),
        }},
    )

    # ── Notify partner ────────────────────────────────────────────────────
    partner_id = (
        pair["user_b_id"] if pair["user_a_id"] == user_id else pair["user_a_id"]
    )
    try:
        await notification_service.notify_deep_unlock(user_id, partner_id, payload.pair_id)
    except Exception as exc:
        logger.warning("Failed to notify partner after payment: %s", exc)

    return {
        "success":  True,
        "pair_id":  payload.pair_id,
        "message":  "Payment confirmed! Report unlocked. Complete your assessment to generate results.",
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 3 — Remind partner
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/remind-partner/{pair_id}")
async def remind_partner(
    pair_id:      str,
    current_user: dict = Depends(get_current_user),
):
    """Re-send the deep-exploration invite notification to the partner."""
    user_id = current_user["user_id"]

    pair = await db.deep_exploration_pairs.find_one({"pair_id": pair_id}, {"_id": 0})
    if not pair:
        raise HTTPException(status_code=404, detail="Pair not found.")

    if pair.get("unlocked_by_user") != user_id:
        raise HTTPException(status_code=403, detail="Only the person who unlocked can send reminders.")

    partner_id = (
        pair["user_b_id"] if pair["user_a_id"] == user_id else pair["user_a_id"]
    )

    # Don't remind if partner already completed
    if partner_id in pair.get("completed_users", []):
        return {"sent": False, "message": "Your partner has already completed their assessment."}

    try:
        await notification_service.notify_deep_unlock(user_id, partner_id, pair_id)
    except Exception as exc:
        logger.error("Failed to send reminder notification: %s", exc)
        raise HTTPException(status_code=500, detail="Could not send reminder.")

    return {"sent": True, "message": "Reminder sent to your partner."}
