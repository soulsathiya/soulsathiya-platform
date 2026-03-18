"""
Relationship Intelligence Report — Unlock, Payment, Status & Reuse Router

Endpoints:
  POST /api/reports/unlock/{partner_id}              — unified access-control + unlock
  POST /api/reports/verify-payment                   — confirm payment & activate pair
  POST /api/reports/remind-partner/{pair_id}         — re-send invite (24h cooldown, max 3)
  GET  /api/reports/status/{partner_id}              — full pair status + expiry + invite link
  POST /api/reports/reuse/{pair_id}/{new_partner_id} — restart flow after expiry
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

# ── Config ─────────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID     = os.environ.get("RAZORPAY_KEY_ID",     "rzp_test_dummy")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
FRONTEND_URL        = os.environ.get("FRONTEND_URL",        "https://soulsathiya.com")
REPORT_PRICE_PAISE  = 99900        # ₹999
PAIR_EXPIRY_DAYS    = 7
MAX_REMINDERS       = 3
REMIND_COOLDOWN_HRS = 24


def _is_dummy_mode() -> bool:
    """True when real Razorpay keys are not yet configured."""
    return (
        not RAZORPAY_KEY_SECRET
        or RAZORPAY_KEY_ID.startswith("rzp_test_dummy")
    )


def generate_invite_link(pair_id: str) -> str:
    """
    Deep-link that takes a partner directly to their assessment.
    Works even before login — the questionnaire page handles the auth redirect.
    """
    return f"{FRONTEND_URL}/deep/questionnaire?pair_id={pair_id}"


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

async def _reset_monthly_quota_if_needed(user: dict) -> dict:
    """
    If the user's monthly reset date has passed (or was never set), zero out
    free_reports_used_this_month and push the reset date 30 days forward.
    """
    now        = datetime.now(timezone.utc)
    reset_date = user.get("free_reports_reset_date")

    if isinstance(reset_date, datetime) and reset_date.tzinfo is None:
        reset_date = reset_date.replace(tzinfo=timezone.utc)

    if (reset_date is None) or (now >= reset_date):
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

    Returns:
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


async def _apply_expiry(pair: dict) -> dict:
    """Auto-expire a pair that has passed its 7-day expiry window (if not completed)."""
    if pair.get("status") in ("completed", "expired", "pending_payment"):
        return pair

    expires_at = pair.get("expires_at")
    if expires_at is None:
        return pair

    if isinstance(expires_at, datetime) and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        await db.deep_exploration_pairs.update_one(
            {"pair_id": pair["pair_id"]},
            {"$set": {"status": "expired"}},
        )
        pair = dict(pair)
        pair["status"] = "expired"

    return pair


async def _get_latest_pair(user_id: str, partner_id: str) -> Optional[dict]:
    """Return the most recently created pair for this user-partner combination."""
    sorted_ids = sorted([user_id, partner_id])
    pairs = await db.deep_exploration_pairs.find(
        {"user_a_id": sorted_ids[0], "user_b_id": sorted_ids[1]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=1)
    return pairs[0] if pairs else None


def _safe_iso(dt) -> Optional[str]:
    """Return ISO string for a datetime, or None if not set."""
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    return None


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
      unlocked   bool
      type       str  — elite | free_premium | payment_required | already_unlocked
      pair_id    str
      message    str
      expires_at str  (ISO, when unlocked)
      invite_link str (when unlocked)
      order      dict (when type == payment_required)
    """
    user_id = current_user["user_id"]
    now     = datetime.now(timezone.utc)

    # ── 1. Already have an active pair? ───────────────────────────────────
    existing = await _get_latest_pair(user_id, partner_id)
    if existing:
        existing = await _apply_expiry(existing)
        status = existing.get("status")
        if status not in ("pending_payment", "expired", None):
            return {
                "unlocked":    True,
                "pair_id":     existing["pair_id"],
                "type":        "already_unlocked",
                "message":     "Report already unlocked. Start or continue your assessment.",
                "expires_at":  _safe_iso(existing.get("expires_at")),
                "invite_link": generate_invite_link(existing["pair_id"]),
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
        pair      = result.get("pair") or result
        pid       = pair.get("pair_id")
        expires_at = now + timedelta(days=PAIR_EXPIRY_DAYS)

        # Stamp expiry & reminder fields (unlock_pair service may not set these)
        await db.deep_exploration_pairs.update_one(
            {"pair_id": pid},
            {"$set": {
                "created_at":       now,
                "expires_at":       expires_at,
                "last_reminded_at": None,
                "reminders_sent":   0,
            }},
        )

        # Increment free-report counter for premium users
        if access["type"] == "free_premium":
            await db.users.update_one(
                {"user_id": user_id},
                {"$inc": {"free_reports_used_this_month": 1}},
            )

        # Notify partner
        try:
            await notification_service.notify_deep_unlock(user_id, partner_id, pid)
        except Exception as exc:
            logger.warning("Failed to notify partner on unlock: %s", exc)

        return {
            "unlocked":    True,
            "pair_id":     pid,
            "type":        access["type"],
            "message":     "Report unlocked! Your partner has been notified.",
            "expires_at":  expires_at.isoformat(),
            "invite_link": generate_invite_link(pid),
        }

    # ── 3c. Payment required ──────────────────────────────────────────────
    order_id = f"order_dummy_{uuid.uuid4().hex[:14]}"

    if existing and existing.get("status") == "pending_payment":
        pair_id  = existing["pair_id"]
        order_id = existing.get("razorpay_order_id", order_id)
    else:
        pair_id    = f"deep_{uuid.uuid4().hex[:12]}"
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
            "created_at":          now,
            "expires_at":          None,   # set after payment confirms
            "last_reminded_at":    None,
            "reminders_sent":      0,
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
    now     = datetime.now(timezone.utc)

    pair = await db.deep_exploration_pairs.find_one(
        {"pair_id": payload.pair_id},
        {"_id": 0},
    )
    if not pair:
        raise HTTPException(status_code=404, detail="Pair not found.")

    if pair.get("unlocked_by_user") != user_id:
        raise HTTPException(status_code=403, detail="Not authorised to verify this payment.")

    if pair.get("payment_status") == "paid":
        return {"success": True, "pair_id": payload.pair_id, "message": "Already activated."}

    # ── Signature verification ─────────────────────────────────────────────
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
        logger.info(
            "Dummy payment accepted for pair %s (order=%s, payment=%s)",
            payload.pair_id, payload.razorpay_order_id, payload.razorpay_payment_id,
        )

    # ── Activate the pair ─────────────────────────────────────────────────
    expires_at = now + timedelta(days=PAIR_EXPIRY_DAYS)
    await db.deep_exploration_pairs.update_one(
        {"pair_id": payload.pair_id},
        {"$set": {
            "payment_status":      "paid",
            "razorpay_payment_id": payload.razorpay_payment_id,
            "status":              "unlocked",
            "unlocked_at":         now,
            "expires_at":          expires_at,
            "last_reminded_at":    None,
            "reminders_sent":      0,
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
        "success":     True,
        "pair_id":     payload.pair_id,
        "message":     "Payment confirmed! Report unlocked. Complete your assessment to generate results.",
        "expires_at":  expires_at.isoformat(),
        "invite_link": generate_invite_link(payload.pair_id),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 3 — Remind partner (24 h cooldown, max 3 reminders)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/remind-partner/{pair_id}")
async def remind_partner(
    pair_id:      str,
    current_user: dict = Depends(get_current_user),
):
    """Re-send the deep-exploration invite notification to the partner."""
    user_id = current_user["user_id"]
    now     = datetime.now(timezone.utc)

    pair = await db.deep_exploration_pairs.find_one({"pair_id": pair_id}, {"_id": 0})
    if not pair:
        raise HTTPException(status_code=404, detail="Pair not found.")

    if pair.get("unlocked_by_user") != user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the person who unlocked the report can send reminders.",
        )

    reminders_sent = int(pair.get("reminders_sent") or 0)

    if reminders_sent >= MAX_REMINDERS:
        raise HTTPException(
            status_code=429,
            detail={
                "code":                "max_reminders_reached",
                "message":             f"You've already sent the maximum of {MAX_REMINDERS} reminders.",
                "remaining_reminders": 0,
            },
        )

    last_reminded_at = pair.get("last_reminded_at")
    if isinstance(last_reminded_at, datetime) and last_reminded_at.tzinfo is None:
        last_reminded_at = last_reminded_at.replace(tzinfo=timezone.utc)

    if last_reminded_at:
        elapsed_seconds = (now - last_reminded_at).total_seconds()
        cooldown_seconds = REMIND_COOLDOWN_HRS * 3600
        if elapsed_seconds < cooldown_seconds:
            hours_left = int((cooldown_seconds - elapsed_seconds) / 3600) + 1
            raise HTTPException(
                status_code=429,
                detail={
                    "code":                "cooldown_active",
                    "message":             f"Please wait {hours_left}h before sending another reminder.",
                    "remaining_reminders": MAX_REMINDERS - reminders_sent,
                },
            )

    partner_id = (
        pair["user_b_id"] if pair["user_a_id"] == user_id else pair["user_a_id"]
    )

    if partner_id in pair.get("completed_users", []):
        return {
            "sent":                False,
            "message":             "Your partner has already completed their assessment.",
            "remaining_reminders": MAX_REMINDERS - reminders_sent,
        }

    try:
        await notification_service.notify_deep_unlock(user_id, partner_id, pair_id)
    except Exception as exc:
        logger.error("Failed to send reminder notification: %s", exc)
        raise HTTPException(status_code=500, detail="Could not send reminder.")

    await db.deep_exploration_pairs.update_one(
        {"pair_id": pair_id},
        {
            "$set": {"last_reminded_at": now},
            "$inc": {"reminders_sent":   1},
        },
    )

    new_count = reminders_sent + 1
    return {
        "sent":                True,
        "message":             "Reminder sent to your partner.",
        "reminders_sent":      new_count,
        "remaining_reminders": max(0, MAX_REMINDERS - new_count),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 4 — Full pair status (used by DeepExplorationCTA)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/status/{partner_id}")
async def get_report_status(
    partner_id:   str,
    current_user: dict = Depends(get_current_user),
):
    """
    Return the current state of the Relationship Intelligence Report for this
    user-partner pair, including expiry countdown, reminder eligibility and the
    invite link for sharing.
    """
    user_id = current_user["user_id"]
    now     = datetime.now(timezone.utc)

    pair = await _get_latest_pair(user_id, partner_id)

    if not pair:
        return {
            "has_pair":            False,
            "pair_id":             None,
            "unlocked":            False,
            "status":              None,
            "user_completed":      False,
            "partner_completed":   False,
            "user_started":        False,
            "both_completed":      False,
            "is_expired":          False,
            "expires_at":          None,
            "days_until_expiry":   None,
            "reminders_sent":      0,
            "last_reminded_at":    None,
            "can_remind":          False,
            "remaining_reminders": 0,
            "invite_link":         None,
        }

    pair = await _apply_expiry(pair)

    # ── Completion state ──────────────────────────────────────────────────
    completed_users   = pair.get("completed_users", [])
    started_users     = pair.get("started_users",   [])
    user_completed    = user_id    in completed_users
    partner_completed = partner_id in completed_users
    user_started      = user_id    in started_users
    both_completed    = user_completed and partner_completed

    pair_status  = pair.get("status")
    is_unlocked  = pair_status == "unlocked"
    is_expired   = pair_status == "expired"
    is_completed = both_completed or pair_status == "completed"

    # ── Expiry countdown ──────────────────────────────────────────────────
    expires_at = pair.get("expires_at")
    if isinstance(expires_at, datetime) and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    days_until_expiry = None
    if expires_at and not is_expired and not is_completed:
        delta = (expires_at - now).total_seconds()
        days_until_expiry = max(0, int(delta / 86400))

    # ── Reminder eligibility ──────────────────────────────────────────────
    reminders_sent   = int(pair.get("reminders_sent") or 0)
    last_reminded_at = pair.get("last_reminded_at")
    if isinstance(last_reminded_at, datetime) and last_reminded_at.tzinfo is None:
        last_reminded_at = last_reminded_at.replace(tzinfo=timezone.utc)

    can_remind = False
    if is_unlocked and not partner_completed and not is_expired:
        if reminders_sent < MAX_REMINDERS:
            if last_reminded_at is None:
                can_remind = True
            elif (now - last_reminded_at).total_seconds() >= REMIND_COOLDOWN_HRS * 3600:
                can_remind = True

    invite_link = generate_invite_link(pair["pair_id"]) if (is_unlocked or is_completed) else None

    return {
        "has_pair":            True,
        "pair_id":             pair["pair_id"],
        "unlocked":            is_unlocked or is_completed,
        "status":              pair_status,
        "user_completed":      user_completed,
        "partner_completed":   partner_completed,
        "user_started":        user_started,
        "both_completed":      both_completed,
        "is_expired":          is_expired,
        "expires_at":          _safe_iso(expires_at),
        "days_until_expiry":   days_until_expiry,
        "reminders_sent":      reminders_sent,
        "last_reminded_at":    _safe_iso(last_reminded_at),
        "can_remind":          can_remind,
        "remaining_reminders": max(0, MAX_REMINDERS - reminders_sent),
        "invite_link":         invite_link,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 5 — Reuse expired pair (same or different partner)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/reuse/{pair_id}/{new_partner_id}")
async def reuse_expired_pair(
    pair_id:        str,
    new_partner_id: str,
    current_user:   dict = Depends(get_current_user),
):
    """
    After a pair expires, start fresh with the same or a different partner.
    Access control is re-evaluated:
      Elite        → free
      Premium      → free if quota allows, else ₹999
      Free user    → 403
    """
    user_id = current_user["user_id"]
    now     = datetime.now(timezone.utc)

    # ── Validate old pair ─────────────────────────────────────────────────
    old_pair = await db.deep_exploration_pairs.find_one({"pair_id": pair_id}, {"_id": 0})
    if not old_pair:
        raise HTTPException(status_code=404, detail="Original pair not found.")
    if old_pair.get("unlocked_by_user") != user_id:
        raise HTTPException(status_code=403, detail="Not authorised to reuse this pair.")
    if old_pair.get("status") != "expired":
        raise HTTPException(
            status_code=400,
            detail=f"Only expired pairs can be reused. Current status: {old_pair.get('status')}",
        )

    # ── Guard: avoid duplicate active pair ───────────────────────────────
    sorted_ids = sorted([user_id, new_partner_id])
    existing_active = await db.deep_exploration_pairs.find_one({
        "user_a_id": sorted_ids[0],
        "user_b_id": sorted_ids[1],
        "status":    {"$in": ["unlocked", "pending_payment"]},
    })
    if existing_active:
        raise HTTPException(
            status_code=400,
            detail="An active report already exists with this partner.",
        )

    # ── Evaluate access ────────────────────────────────────────────────────
    access = await check_report_access(current_user)

    if access["type"] == "upgrade_required":
        raise HTTPException(
            status_code=403,
            detail={"type": "upgrade_required", "message": access["message"]},
        )

    expires_at = now + timedelta(days=PAIR_EXPIRY_DAYS)

    # ── Free access ───────────────────────────────────────────────────────
    if access["allowed"]:
        new_pair_id = f"deep_{uuid.uuid4().hex[:12]}"
        await db.deep_exploration_pairs.insert_one({
            "pair_id":             new_pair_id,
            "user_a_id":           sorted_ids[0],
            "user_b_id":           sorted_ids[1],
            "unlocked_by_user":    user_id,
            "tier_at_unlock":      current_user.get("subscription_tier", "premium"),
            "payment_status":      "free",
            "razorpay_order_id":   None,
            "razorpay_payment_id": f"reuse_{uuid.uuid4().hex[:10]}",
            "started_users":       [],
            "completed_users":     [],
            "status":              "unlocked",
            "unlocked_at":         now,
            "completed_at":        None,
            "created_at":          now,
            "expires_at":          expires_at,
            "last_reminded_at":    None,
            "reminders_sent":      0,
        })

        if access["type"] == "free_premium":
            await db.users.update_one(
                {"user_id": user_id},
                {"$inc": {"free_reports_used_this_month": 1}},
            )

        try:
            await notification_service.notify_deep_unlock(user_id, new_partner_id, new_pair_id)
        except Exception as exc:
            logger.warning("Failed to notify partner on reuse: %s", exc)

        return {
            "unlocked":    True,
            "pair_id":     new_pair_id,
            "type":        access["type"],
            "message":     "New report unlocked! Your partner has been notified.",
            "expires_at":  expires_at.isoformat(),
            "invite_link": generate_invite_link(new_pair_id),
        }

    # ── Payment required ──────────────────────────────────────────────────
    new_pair_id  = f"deep_{uuid.uuid4().hex[:12]}"
    new_order_id = f"order_dummy_{uuid.uuid4().hex[:14]}"

    await db.deep_exploration_pairs.insert_one({
        "pair_id":             new_pair_id,
        "user_a_id":           sorted_ids[0],
        "user_b_id":           sorted_ids[1],
        "unlocked_by_user":    user_id,
        "tier_at_unlock":      current_user.get("subscription_tier", "premium"),
        "payment_status":      "pending",
        "razorpay_order_id":   new_order_id,
        "razorpay_payment_id": None,
        "started_users":       [],
        "completed_users":     [],
        "status":              "pending_payment",
        "unlocked_at":         None,
        "completed_at":        None,
        "created_at":          now,
        "expires_at":          None,   # set after payment confirms
        "last_reminded_at":    None,
        "reminders_sent":      0,
    })

    return {
        "unlocked": False,
        "type":     "payment_required",
        "message":  access["message"],
        "pair_id":  new_pair_id,
        "order": {
            "id":              new_order_id,
            "amount":          REPORT_PRICE_PAISE,
            "currency":        "INR",
            "razorpay_key_id": RAZORPAY_KEY_ID,
            "is_dummy":        _is_dummy_mode(),
        },
    }
